const axios = require("axios");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const stripe = require("stripe")(process.env["STRIPE_SECRET_KEY"]);
const endpointSecret = process.env["STRIPE_SECRET_WEBHOOK"];

// EXPRESS SETUP
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use((req, res, next) => {
  bodyParser.json({
    verify: (req, _, buf) => {
      try {
        JSON.parse(buf.toString());
        req.rawBody = buf.toString();
      } catch (e) {
        console.error(`Invalid JSON: ${buf.toString()}`);
      }
    },
  })(req, res, next);
});

app.use(cors({ origin: process.env["CLIENT_DOMAIN"] }));

// FIREBASE SETUP
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env["FIREBASE_PROJECT_ID"],
    clientEmail: process.env["FIREBASE_CLIENT_EMAIL"],
    privateKey: process.env["FIREBASE_PRIVATE_KEY"].replace(/\\n/g, "\n"),
  }),
});
const db = admin.firestore();

// ENDPOINTS
app.post("/api/v1/vehicledata/free/:registrationNumber", async (req, res) => {
  var config = {
    method: "post",
    url: process.env["VEHICLE_FREE_DATA_URL"],
    headers: {
      "x-api-key": process.env["VEHICLE_FREE_DATA_API_KEY"],
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      registrationNumber: req.params.registrationNumber.toString(),
    }),
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
  console.log("vehicledata/free endpoint hit");
});

app.get("/api/v1/chatgpt", async (req, res) => {});

app.post("/api/v1/create-payment-intent", async (req, res) => {
  const { email, price, vehicleFreeData } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: price,
    currency: "gbp",
    automatic_payment_methods: {
      enabled: true,
    },
    receipt_email: email,
    metadata: {
      registrationNumber: vehicleFreeData.registrationNumber,
      taxStatus: vehicleFreeData.taxStatus,
      taxDueDate: vehicleFreeData.taxDueDate,
      motStatus: vehicleFreeData.motStatus,
      make: vehicleFreeData.make,
      yearOfManufacture: vehicleFreeData.yearOfManufacture,
      engineCapacity: vehicleFreeData.engineCapacity,
      co2Emissions: vehicleFreeData.co2Emissions,
      fuelType: vehicleFreeData.fuelType,
      markedForExport: vehicleFreeData.markedForExport,
      colour: vehicleFreeData.colour,
      typeApproval: vehicleFreeData.typeApproval,
      dateOfLastV5CIssued: vehicleFreeData.dateOfLastV5CIssued,
      motExpiryDate: vehicleFreeData.motExpiryDate,
      wheelplan: vehicleFreeData.wheelplan,
      monthOfFirstRegistration: vehicleFreeData.monthOfFirstRegistration,
    },
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

app.post("/api/v1/webhook", (req, res) => {
  console.log("webhook endpoint hit");
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const email = event["data"]["object"]["receipt_email"];
      const vehicleFreeData = {
        RegistrationNumber:
          event["data"]["object"]["metadata"]["registrationNumber"],
        TaxStatus: event["data"]["object"]["metadata"]["taxStatus"],
        TaxDueDate: event["data"]["object"]["metadata"]["taxDueDate"],
        MotStatus: event["data"]["object"]["metadata"]["motStatus"],
        Make: event["data"]["object"]["metadata"]["make"],
        YearOfManufacture:
          event["data"]["object"]["metadata"]["yearOfManufacture"],
        EngineCapacity: event["data"]["object"]["metadata"]["engineCapacity"],
        Co2Emissions: event["data"]["object"]["metadata"]["co2Emissions"],
        FuelType: event["data"]["object"]["metadata"]["fuelType"],
        MarkedForExport: event["data"]["object"]["metadata"]["markedForExport"],
        Colour: event["data"]["object"]["metadata"]["colour"],
        TypeApproval: event["data"]["object"]["metadata"]["typeApproval"],
        DateOfLastV5CIssued:
          event["data"]["object"]["metadata"]["dateOfLastV5CIssued"],
        MotExpiryDate: event["data"]["object"]["metadata"]["motExpiryDate"],
        Wheelplan: event["data"]["object"]["metadata"]["wheelplan"],
        MonthOfFirstRegistration:
          event["data"]["object"]["metadata"]["monthOfFirstRegistration"],
      };

      const paymentId = event["data"]["object"]["id"];

      fetchAndStoreVehicleData(
        email,
        vehicleFreeData,
        paymentId,
        process.env["UKVD_API_KEY"]
      )
        .then(() => {
          res.json({ received: true });
        })
        .catch((err) => {
          console.error(`Error handling success: ${err}`);
          res.status(500).send(err.message);
        });
      break;
    }
    default:
      return res.status(400).end();
  }
});

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

const port = 4242;
app.listen(port, () => console.log(`Listening on port ${port}...`));
