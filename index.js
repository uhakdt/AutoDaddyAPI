const axios = require("axios");
const admin = require("firebase-admin");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY_DEV);
const endpointSecret = process.env.STRIPE_SECRET_WEBHOOK;

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

app.use(cors({ origin: "http://localhost:3000" }));

// FIREBASE SETUP
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = admin.firestore();

// ENDPOINTS
app.post("/api/v1/vehicledata/free/:registrationNumber", async (req, res) => {
  var config = {
    method: "post",
    url: "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    headers: {
      "x-api-key": process.env.VEHICLE_FREE_DATA_API_KEY,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      registrationNumber: req.params.registrationNumber.toString(),
    }),
  };

  axios(config)
    .then(function (response) {
      console.log(response.data);
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
  console.log("vehicledata/free endpoint hit");
});

app.post("/api/v1/vehicledata/full", async (req, res) => {
  const apiKey = process.env.UKVD_API_KEY_DEV;
  const packages = ["VehicleAndMotHistory"];

  const fetchData = async (packageName, vehicleRegMark, apiKey) => {
    const url = `https://uk1.ukvehicledata.co.uk/api/datapackage/${packageName}?v=2&api_nullitems=1&key_vrm=${vehicleRegMark}&auth_apikey=${apiKey}`;
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

  const fetchAllData = async (packages, vehicleRegMark, apiKey) => {
    const data = await Promise.all(
      packages.map((packageName) =>
        fetchData(packageName, vehicleRegMark, apiKey)
      )
    );

    return Object.assign({}, ...data);
  };

  try {
    // Validate request parameters
    if (!req.body.registrationNumber || !req.body.uid || !req.body.orderId) {
      res
        .status(400)
        .send("Registration number, user UID, and order ID are required");
      return;
    }

    const dataMain = await fetchAllData(
      packages,
      req.body.registrationNumber.toString(),
      apiKey
    );

    // Get the specific order document of the user
    const orderDoc = db
      .collection("users")
      .doc(req.body.uid)
      .collection("orders")
      .doc(req.body.orderId);

    // Add the vehicleData to the order document
    await orderDoc.set({ vehicleData: dataMain }, { merge: true });

    res
      .status(200)
      .send("Vehicle data added successfully to the order document.");
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
    res
      .status(500)
      .send("An error occurred while fetching data. Please try again.");
  }
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
      console.log("PaymentIntent was successful!");
      const email = event["data"]["object"]["receipt_email"];
      const regNumber = event["data"]["object"]["metadata"]["regNumber"];

      fetchAndStoreVehicleData(email, regNumber)
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
  res.json({ received: true });
});

const fetchAndStoreVehicleData = async (email, regNumber) => {
  const apiKey = process.env.UKVD_API_KEY_DEV;
  const packages = ["VehicleAndMotHistory"];

  const fetchData = async (packageName, vehicleRegMark, apiKey) => {
    const url = `https://uk1.ukvehicledata.co.uk/api/datapackage/${packageName}?v=2&api_nullitems=1&key_vrm=${vehicleRegMark}&auth_apikey=${apiKey}`;
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

  const fetchAllData = async (packages, vehicleRegMark, apiKey) => {
    const data = await Promise.all(
      packages.map((packageName) =>
        fetchData(packageName, vehicleRegMark, apiKey)
      )
    );

    return Object.assign({}, ...data);
  };

  const userSnapshot = await db
    .collection("users")
    .where("email", "==", email)
    .get();

  if (userSnapshot.empty) {
    throw new Error(`No user found with email: ${email}`);
  }

  const userDoc = userSnapshot.docs[0];
  const uid = userDoc.get("uid");
  const orderId = userDoc.get("orderId");

  const dataMain = await fetchAllData(packages, regNumber.toString(), apiKey);

  const orderDoc = db
    .collection("users")
    .doc(uid)
    .collection("orders")
    .doc(orderId);

  await orderDoc.set({ vehicleData: dataMain }, { merge: true });
};

app.get("/", (req, res) => {
  res.send("Hello");
});

const port = 4242;
app.listen(port, () => console.log(`Listening on port ${port}...`));
