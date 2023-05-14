const express = require("express");
const axios = require("axios");
const admin = require("firebase-admin");
require("dotenv").config();

const stripe = require("stripe")(
  "sk_test_51MkoADLJE9t4rWObnQV3ZeAJM7moXR7nDUe4KoaJDkulj219tB9V9l2u0EVu9gCGQUq8l9xBJAeL1IQ00l9hgQyt00b0vki7wT"
);
const stripeWebhookSecret = "your_stripe_webhook_secret"; // Replace this with your Stripe webhook signing secret

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const bodyParser = require("body-parser"); // If you don't have this already, install with npm install --save body-parser

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

// const YOUR_DOMAIN = 'https://AutoDaddyAPI.uhakdt.repl.co/api/v1';
const CLIENT_DOMAIN = "http://localhost:3000";

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/api/v1/vehicledata/free/:registrationNumber", async (req, res) => {
  var config = {
    method: "post",
    url: "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    headers: {
      "x-api-key": "cMQncH4Szk8qpKoPQOlTQ5Cu9paQSp3KuNIcxzt0",
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

app.post("/api/v1/vehicledata/basic", async (req, res) => {
  var config = {
    method: "get",
    url: "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    headers: {
      "x-api-key": "cMQncH4Szk8qpKoPQOlTQ5Cu9paQSp3KuNIcxzt0",
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      registrationNumber: req.body.registrationNumber.toString(),
    }),
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });

  console.log("vehicledata/basic endpoint hit");
});

app.post("/api/v1/vehicledata/full", async (req, res) => {
  const apiKey = "ad296227-c4a3-44e3-806b-476d634439e8";

  const packages = [
    "BatteryData",
    "FuelPriceData",
    "MotHistoryAndTaxStatusData",
    "MotHistoryData",
    "PostcodeLookup",
    "SpecAndOptionsData",
    "TyreData",
    "ValuationCanPrice",
    "ValuationData",
    "VdiCheckFull",
    "VehicleAndMotHistory",
    "VehicleData",
    "VehicleDataIRL",
    "VehicleImageData",
    "VehicleTaxData",
  ];

  const fetchData = async (packageName, vehicleRegMark, apiKey) => {
    const url = `https://uk1.ukvehicledata.co.uk/api/datapackage/${packageName}?v=2&api_nullitems=1&key_vrm=${vehicleRegMark}&auth_apikey=${apiKey}`;
    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error("Network response was not ok");
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

  fetchAllData(packages, req.body.registrationNumber.toString(), apiKey)
    .then((data) => {
      console.log("Data fetched successfully!");
      console.log(data);
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });

  console.log("vehicledata/full endpoint hit");
});

app.get("/api/v1/chatgpt", async (req, res) => {});

app.post("/api/v1/create-checkout-session", async (req, res) => {
  var vehicleFreeData = JSON.parse(req.body.vehicleFreeData);
  var tier = JSON.parse(req.body.tier);
  var userId = JSON.parse(req.body.userId);

  let priceId;

  if (tier.toString() === "basic") {
    priceId = "price_1N5fRvLJE9t4rWObAZejM2KP";
  } else if (tier.toString() === "full") {
    priceId = "price_1N5fSNLJE9t4rWObyuziwRXa";
  } else {
    res.status(400).send("Invalid tier");
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${CLIENT_DOMAIN}/payment?success=true`,
      cancel_url: `${CLIENT_DOMAIN}/payment?canceled=true`,
      automatic_tax: { enabled: true },
    });

    const docRef = db.collection("orders").doc(session.id);
    await docRef.set({ sessionId: session.id });

    res.redirect(303, session.url);
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    res.status(500).send("Failed to create Stripe session");
  }
});

app.post("/api/v1/webhook", bodyParser.json(), (request, response) => {
  let event = request.body;
  // Only verify the event if you have an endpoint secret defined.
  // Otherwise use the basic event deserialized with JSON.parse
  if (process.env.STRIPE_WEBHOOK_SECRET) {
    // Get the signature sent by Stripe
    const signature = request.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case "payment_method.attached":
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

app.get("/", (req, res) => {
  res.send("Hello");
});

const port = 4242;
app.listen(port, () => console.log(`Listening on port ${port}...`));
