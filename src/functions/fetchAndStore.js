import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { db, storage } from "../firebase.js";
import dataExtract from "./dataExtract.js";
import sendEmail from "../email.js";

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fetchAndStoreVehicleData = async (
  uid,
  email,
  vehicleFreeData,
  paymentId
) => {
  try {
    let packageUrls = [
      process.env["UKVD_API_URL_VEHICLE_AND_MOT_HISTORY"],
      process.env["UKVD_API_URL_VDI_CHECK_FULL"],
      process.env["UKVD_API_URL_VEHICLE_IMAGE_DATA"],
    ];
    let vehicleRegMark = vehicleFreeData.RegistrationNumber.toString();
    const replaceUndefinedWithEmptyString = (obj) => {
      const keys = Object.keys(obj);
      keys.forEach((key) => {
        if (obj[key] && typeof obj[key] === "object") {
          replaceUndefinedWithEmptyString(obj[key]);
        } else if (obj[key] === undefined) {
          obj[key] = "";
        }
      });
    };

    replaceUndefinedWithEmptyString(vehicleFreeData); // handle undefined values for vehicleFreeData

    const fetchData = async (packageUrl, vehicleRegMark) => {
      try {
        const response = await axios.get(packageUrl + vehicleRegMark);

        if (response.status !== 200) {
          throw new Error(
            `API response was not ok. Status: ${response.status}`
          );
        }

        if (response.data.Response.StatusCode === "KeyInvalid") {
          throw new Error(
            "Invalid VRM. Please provide a valid vehicle registration mark"
          );
        }

        if (response.data.Response.StatusCode !== "Success") {
          throw new Error(`API error: ${response.data.Response.StatusMessage}`);
        }

        return response.data;
      } catch (error) {
        console.error("Error fetching data from UK Vehicle Data:", error);
        throw error;
      }
    };

    const fetchAllData = async (packageUrls, vehicleRegMark) => {
      const data = await Promise.all(
        packageUrls.map((packageUrl) => fetchData(packageUrl, vehicleRegMark))
      );

      const dataObject = {};
      for (let i = 0; i < packageUrls.length; i++) {
        if (packageUrls[i].includes("VehicleAndMotHistory")) {
          dataObject["VehicleAndMotHistory"] = data[i].Response.DataItems;
        } else if (packageUrls[i].includes("VdiCheckFull")) {
          dataObject["VdiCheckFull"] = data[i].Response.DataItems;
        } else if (packageUrls[i].includes("VehicleImageData")) {
          dataObject["VehicleImages"] = data[i].Response.DataItems;
        }
      }

      return dataObject;
    };

    const orderId = uuidv4();
    const orderDoc = db.collection("orders").doc(orderId);

    const currentDateTime = new Date().toISOString();
    const bucket = storage.bucket();

    const downloadImage = async (url, destination) => {
      try {
        const response = await axios({
          url,
          responseType: "stream",
        });
        await response.data.pipe(bucket.file(destination).createWriteStream());
      } catch (error) {
        console.error(`Error downloading image from URL "${url}":`, error);
        throw error;
      }
    };

    const fetchAndStoreAllImages = async (imageList, orderId, uid) => {
      for (let i = 0; i < imageList.length; i++) {
        const imageUrl = imageList[i].ImageUrl;
        const fileName = `${orderId}_image_${i}.jpg`;
        const filePath = `user_files/${uid}/car_images/${fileName}`;
        try {
          await downloadImage(imageUrl, filePath);
        } catch (error) {
          console.error(`Error downloading and storing image ${i + 1}:`, error);
          throw error;
        }
      }
    };

    const dataMain = await fetchAllData(packageUrls, vehicleRegMark);

    replaceUndefinedWithEmptyString(dataMain); // handle undefined values for dataMain

    await fetchAndStoreAllImages(
      dataMain.VehicleImages.VehicleImages.ImageDetailsList,
      orderId,
      uid
    );

    let isUlezCompliant = IsULEZCompliant(
      dataMain.VehicleAndMotHistory?.VehicleRegistration?.FuelType,
      dataMain.VehicleAndMotHistory?.TechnicalDetails?.General?.EuroStatus,
      dataMain.VehicleAndMotHistory?.VehicleRegistration?.VehicleClass
    );

    let extractedData = dataExtract(dataMain, vehicleFreeData, isUlezCompliant);

    await orderDoc.set({
      orderId: orderId,
      uid: uid,
      paymentId: paymentId,
      data: dataMain,
      extractedData: extractedData,
      ulez: isUlezCompliant,
      dateTime: currentDateTime,
      vehicleFreeData: vehicleFreeData,
      gptRequested: false,
      gptChatRequestNumber: 20,
    });

    const url = `${process.env["CLIENT_DOMAIN"]}/dashboard?orderId=${orderId}`;
    await sendEmail(email, url);
    return {
      success: true,
      orderId: orderId,
      message: "Order created successfully",
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const fetchAndStoreOneAutoAPI = async (email, vehicleFreeData, paymentId) => {
  let vehicleRegMark = vehicleFreeData.RegistrationNumber.toString();
  let services = [
    `/ukvehicledata/vehicleandmodeldetailsfromvrm?vehicle_registration_mark=${vehicleRegMark}`,
    `/experian/autocheck/v2?vehicle_registration_mark=${vehicleRegMark}`,
    `/carguide/salvagecheck?vehicle_registration_mark=${vehicleRegMark}`,
    `/carguide/mothistoryandpredictions?vehicle_registration_mark=${vehicleRegMark}`,
  ];

  const fetchData = async (service) => {
    try {
      var config = {
        method: "get",
        url: process.env["ONE_AUTO_API_URL"] + service,
        headers: {
          "x-api-key": process.env["ONE_AUTO_API_KEY"],
          "Content-Type": "application/json",
        },
      };

      const response = await axios(config);

      if (response.status !== 200) {
        throw new Error(`API response was not ok. Status: ${response.status}`);
      }

      return response.data.result;
    } catch (error) {
      console.error(
        `Error fetching data from One Auto API for ${service}. Error message: ${error.message}`
      );
      throw error;
    }
  };

  const fetchAllData = async (services) => {
    const data = await Promise.all(
      services.map((service) => fetchData(service))
    );

    const dataObject = {};
    for (let i = 0; i < services.length; i++) {
      if (services[i].includes("ukvehicledata")) {
        dataObject["ukvehicledata"] = data[i];
      } else if (services[i].includes("experian")) {
        dataObject["experian"] = data[i];
      } else if (services[i].includes("mot")) {
        dataObject["mot"] = data[i];
      } else if (services[i].includes("salvage")) {
        dataObject["salvage"] = data[i];
      } else {
        throw new Error(`Unknown service: ${services[i]}`);
      }
    }

    return dataObject;
  };

  const user = await db.collection("users").where("email", "==", email).get();

  if (user.empty) {
    throw new Error(`No user found with email: ${email}`);
  }

  const userDoc = user.docs[0];
  const uid = userDoc.get("uid");

  const orderId = uuidv4();

  const orderDoc = db.collection("orders").doc(orderId);

  const currentDateTime = new Date().toISOString();
  const bucket = storage.bucket();

  // const downloadImage = async (url, destination) => {
  //   try {
  //     const response = await axios({
  //       url,
  //       responseType: "stream",
  //     });
  //     await response.data.pipe(bucket.file(destination).createWriteStream());
  //   } catch (error) {
  //     console.error(`Error downloading image from URL "${url}":`, error);
  //     throw error;
  //   }
  // };

  const fetchAndStoreAllImages = async (imageList, orderId, uid) => {
    for (let i = 0; i < imageList.length; i++) {
      const imageUrl = imageList[i].ImageUrl;
      const fileName = `${orderId}_image_${i}.jpg`;
      const filePath = `user_files/${uid}/car_images/${fileName}`;
      try {
        await downloadImage(imageUrl, filePath);
      } catch (error) {
        console.error(`Error downloading and storing image ${i + 1}:`, error);
        throw error;
      }
    }
  };

  const dataMain = await fetchAllData(services);

  replaceUndefinedWithEmptyString(dataMain); // handle undefined values for dataMain

  // await fetchAndStoreAllImages(
  //   dataMain.VehicleImageData.VehicleImages.ImageDetailsList,
  //   orderId,
  //   uid
  // );

  // const gptBody = {
  //   dateTime: currentDateTime,
  //   data: dataMain,
  //   orderId: orderId,
  //   paymentId: paymentId,
  //   vehicleFreeData: vehicleFreeData,
  //   uid: uid,
  // };

  // const gptResponse = await axios
  //   .post("https://autodaddy-gpt.uhakdt.repl.co/chat", gptBody)
  //   .then((response) => {
  //     return response.data;
  //   })
  //   .catch((error) => {
  //     console.error("Error sending data to GPT-3:", error);
  //     throw error;
  //   });

  await orderDoc
    .set({
      orderId: orderId,
      uid: uid,
      paymentId: paymentId,
      data: dataMain,
      dateTime: currentDateTime,
      vehicleFreeData: vehicleFreeData,
      // gptResponse: gptResponse,
    })
    .catch((error) => {
      console.error("Error writing order to database:", error);
      throw error;
    });
};

const IsULEZCompliant = (fuelType, euroScore, vehicleClass) => {
  if (!fuelType || !vehicleClass || euroScore === null || euroScore === "") {
    return false;
  }

  fuelType = fuelType.toLowerCase();
  vehicleClass = vehicleClass.toLowerCase();

  if (vehicleClass === "motorcycle") {
    return euroScore >= 3;
  }

  if (vehicleClass === "car") {
    if (fuelType === "petrol") {
      return euroScore >= 4;
    } else if (fuelType === "diesel") {
      return euroScore >= 6;
    } else {
      return false;
    }
  }

  return false;
};

export { fetchAndStoreVehicleData, fetchAndStoreOneAutoAPI };
