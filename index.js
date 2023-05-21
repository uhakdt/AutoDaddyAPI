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

// app.post("/api/v1/create-checkout-session", async (req, res) => {
//   var vehicleFreeData = JSON.parse(req.body.vehicleFreeData);
//   var tier = JSON.parse(req.body.tier);
//   var userId = JSON.parse(req.body.userId);

//   let priceId;

//   if (tier.toString() === "basic") {
//     priceId = "price_1N5fRvLJE9t4rWObAZejM2KP";
//   } else if (tier.toString() === "full") {
//     priceId = "price_1N5fSNLJE9t4rWObyuziwRXa";
//   } else {
//     res.status(400).send("Invalid tier");
//     return;
//   }

//   try {
//     const session = await stripe.checkout.sessions.create({
//       line_items: [
//         {
//           price: priceId,
//           quantity: 1,
//         },
//       ],
//       mode: "payment",
//       success_url: `${CLIENT_DOMAIN}/payment?success=true`,
//       cancel_url: `${CLIENT_DOMAIN}/payment?canceled=true`,
//       automatic_tax: { enabled: true },
//     });

//     const docRef = db.collection("orders").doc(session.id);
//     await docRef.set({ sessionId: session.id });

//     res.redirect(303, session.url);
//   } catch (error) {
//     console.error("Error creating Stripe session:", error);
//     res.status(500).send("Failed to create Stripe session");
//   }
// });

app.post("/api/v1/create-payment-intent", async (req, res) => {
  const { email } = req.body;
  console.log(req.body);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 100,
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

app.post("/webhooks", (req, res) => {
  console.log("Webhook received:", req.rawBody); // Debug Statement 1
  console.log("Headers:", req.headers); // Debug Statement 2

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const email = event["data"]["object"]["receipt_email"]; // contains the email that will recive the recipt for the payment (users email usually)
      console.log(`PaymentIntent was successful for ${email}!`);
      break;
    }
    default:
      // Unexpected event type
      return res.status(400).end();
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
});

app.get("/", (req, res) => {
  res.send("Hello");
});

const port = 4242;
app.listen(port, () => console.log(`Listening on port ${port}...`));
