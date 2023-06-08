const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const db = require("../firebase");

const fetchAndStoreVehicleData = async (
  email,
  vehicleFreeData,
  paymentId,
  ukvdApiKey
) => {
  let packages = ["VehicleAndMotHistory", "VdiCheckFull"];

  const fetchData = async (packageName, vehicleRegMark, ukvdApiKey) => {
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

  const dataMain = await fetchAllData(
    packages,
    vehicleFreeData.RegistrationNumber.toString(),
    ukvdApiKey
  );

  const orderId = uuidv4();

  const orderDoc = db.collection("orders").doc(orderId);

  const currentDateTime = new Date().toISOString();

  await orderDoc.set({
    orderId: orderId,
    userId: uid,
    paymentId: paymentId,
    data: dataMain,
    dateTime: currentDateTime,
    vehicleFreeData: vehicleFreeData,
  });
  console.log("Order successfully written to database");
};

module.exports = fetchAndStoreVehicleData;
