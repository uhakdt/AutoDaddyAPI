import app from "./express.js";
import { db, storage } from "./firebase.js";
import { stripe, endpointSecret } from "./stripe.js";
import axios from "axios";
import fetchAndStoreVehicleData from "./functions/fetchAndStore.js";
import sendEmail from "./email.js";

app.get("/", (req, res) => {
  res.send("﷽");
});

app.get("/api/v1/chatgpt", async (req, res) => {});

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
      res.status(404).send({ message: "Registration number not found" }); // Send a 404 status when error
    });
  console.log("vehicledata/free endpoint hit");
});

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

app.post("/api/v1/download-report", async (req, res) => {
  try {
    console.log("download-report endpoint hit");
    const { orderId, vehicleRegMark, userId } = req.body;

    const orderSnapshot = await db.collection("orders").doc(orderId).get();

    if (!orderSnapshot.exists) {
      return res.status(404).send("Order not found");
    }

    const order = orderSnapshot.data();

    // Check if this order belongs to the authenticated user
    if (order.userId !== userId) {
      return res.status(403).send("This order does not belong to you");
    }

    // Create file path
    const filePath = `user_files/${userId}/reports/${vehicleRegMark}_${orderId}.pdf`;

    // Create signed URL
    const bucket = storage.bucket();
    const [url] = await bucket.file(filePath).getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60, // 1 hour
    });

    res.json({ url });
  } catch (error) {
    console.error("Error getting download URL:", error);
    res.status(500).send("Error getting download URL");
  }
});

app.post("/api/v1/email-report", async (req, res) => {
  try {
    const { orderId, vehicleRegMark, userId, email } = req.body;

    const orderSnapshot = await db.collection("orders").doc(orderId).get();
    if (!orderSnapshot.exists) {
      return res.status(404).send("Order not found");
    }

    const order = orderSnapshot.data();
    if (order.userId !== userId) {
      return res.status(403).send("This order does not belong to you");
    }

    const filePath = `user_files/${userId}/reports/${vehicleRegMark}_${orderId}.pdf`;
    const bucket = storage.bucket();
    const [url] = await bucket.file(filePath).getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60,
    });

    sendEmail(email, orderId, url)
      .then(() => {
        res.status(200).json({ message: "Email sent successfully" });
      })
      .catch((error) => {
        res
          .status(500)
          .json({ message: "Error sending email", error: error.toString() });
      });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Error sending email: ", error);
  }
});

export default app;
