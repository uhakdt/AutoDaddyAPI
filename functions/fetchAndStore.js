const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { db, storage } = require("../firebase");
const fs = require("fs");
const stream = require("stream");
const markdownpdf = require("markdown-pdf");

const fetchAndStoreVehicleData = async (
  email,
  vehicleFreeData,
  paymentId,
  ukvdApiKey
) => {
  let packages = ["VehicleAndMotHistory", "VdiCheckFull", "VehicleImageData"];
  let vehicleRegMark = vehicleFreeData.RegistrationNumber.toString();

  const fetchData = async (packageName, vehicleRegMark, ukvdApiKey) => {
    try {
      const url = `https://uk1.ukvehicledata.co.uk/api/datapackage/${packageName}?v=2&api_nullitems=1&key_vrm=${vehicleRegMark}&auth_apikey=${ukvdApiKey}`;
      const response = await axios.get(url);

      if (response.status !== 200) {
        throw new Error(`API response was not ok. Status: ${response.status}`);
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

  const fetchAllData = async (packages, vehicleRegMark, ukvdApiKey) => {
    const data = await Promise.all(
      packages.map((packageName) =>
        fetchData(packageName, vehicleRegMark, ukvdApiKey)
      )
    );

    const dataObject = {};
    for (let i = 0; i < packages.length; i++) {
      dataObject[packages[i]] = data[i].Response.DataItems;
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

  const fetchAndStoreAllImages = async (imageList, orderId, userId) => {
    for (let i = 0; i < imageList.length; i++) {
      const imageUrl = imageList[i].ImageUrl;
      const fileName = `${orderId}_image_${i}.jpg`;
      const filePath = `user_files/${userId}/car_images/${fileName}`;
      try {
        await downloadImage(imageUrl, filePath);
      } catch (error) {
        console.error(`Error downloading and storing image ${i + 1}:`, error);
        throw error;
      }
    }
  };

  const dataMain = await fetchAllData(packages, vehicleRegMark, ukvdApiKey);

  await fetchAndStoreAllImages(
    dataMain.VehicleImageData.VehicleImages.ImageDetailsList,
    orderId,
    uid
  );

  await orderDoc
    .set({
      orderId: orderId,
      userId: uid,
      paymentId: paymentId,
      data: dataMain,
      dateTime: currentDateTime,
      vehicleFreeData: vehicleFreeData,
    })
    .catch((error) => {
      console.error("Error writing order to database:", error);
      throw error;
    });

  console.log("Order successfully written to database");

  try {
    await createPdfAndUploadToStorage(uid, vehicleRegMark, orderId);
  } catch (error) {
    console.error("Error occurred while creating or uploading the PDF:", error);
    throw error;
  }
};

const createPdfAndUploadToStorage = async (userId, vehicleRegMark, orderId) => {
  try {
    let filename = `${vehicleRegMark}_${orderId}.pdf`;

    // Markdown to PDF
    let markdown = fs.readFileSync("./reportTemplate.md", "utf8");
    let yourVariable = "﷽";
    let markdownText = markdown.replace("An h1 header", yourVariable);

    // Create stream for PDF
    const readable = new stream.Readable();
    readable._read = () => {};
    readable.push(markdownText);
    readable.push(null);

    // Convert markdown to PDF
    const pdfStream = readable.pipe(markdownpdf());

    // Create writable stream to Firebase storage
    const bucket = storage.bucket();
    const filePath = `user_files/${userId}/reports/${filename}`;
    const file = bucket.file(filePath);
    const writeStream = file.createWriteStream({
      metadata: {
        contentType: "application/pdf",
      },
    });

    pdfStream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", (error) => {
        console.error(
          "Error occurred while writing to Firebase Storage:",
          error
        );
        reject(error);
      });
    });

    console.log("PDF successfully uploaded to Firebase Storage");
  } catch (error) {
    console.error(
      "Error occurred while creating the PDF or initiating upload:",
      error
    );
    throw error;
  }
};

module.exports = fetchAndStoreVehicleData;
