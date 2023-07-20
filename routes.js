import app from "./express.js";
import { db, storage } from "./firebase.js";
import { stripe, endpointSecret } from "./stripe.js";
import axios from "axios";
import {
  fetchAndStoreVehicleData,
  fetchAndStoreOneAutoAPI,
} from "./functions/fetchAndStore.js";
import sendEmail from "./email.js";
import { createOrder, capturePayment } from "./paypal.js";

app.get("/api/v1", (req, res) => {
  console.log("ﷺ ﷽");
  res.send("ﷺ ﷽");
});

// DVLA - Vehicle Free Data
app.post("/api/v1/dvla/:registrationNumber", async (req, res) => {
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
      res.status(404).send({ message: "Registration number not found" }); // Send a 404 status when error
    });
});

// ONE AUTO API - UK Vehicle Data
app.get("/api/v1/oneautoapi/ukvd/:registrationNumber", async (req, res) => {
  console.log("ﷺ ﷽");
  var config = {
    method: "get",
    url:
      process.env["ONE_AUTO_API_URL"] +
      `/ukvehicledata/vehicleandmodeldetailsfromvrm?vehicle_registration_mark=${req.params.registrationNumber.toString()}`,
    headers: {
      "x-api-key": process.env["ONE_AUTO_API_KEY"],
      "Content-Type": "application/json",
    },
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.status(404).send({ message: "Registration number not found" });
    });
});

// ONE AUTO API - Experian
app.get("/api/v1/oneautoapi/experian/:registrationNumber", async (req, res) => {
  console.log("ﷺ ﷽");
  var config = {
    method: "get",
    url:
      process.env["ONE_AUTO_API_URL"] +
      `/experian/autocheck/v2?vehicle_registration_mark=${req.params.registrationNumber.toString()}`,
    headers: {
      "x-api-key": process.env["ONE_AUTO_API_KEY"],
      "Content-Type": "application/json",
    },
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.status(404).send({ message: "Registration number not found" });
    });
});

// ONE AUTO API - Car Guide - Salvage Check
app.get(
  "/api/v1/oneautoapi/carguide/salvagecheck/:registrationNumber",
  async (req, res) => {
    console.log("ﷺ ﷽");
    var config = {
      method: "get",
      url:
        process.env["ONE_AUTO_API_URL"] +
        `/carguide/salvagecheck?vehicle_registration_mark=${req.params.registrationNumber.toString()}`,
      headers: {
        "x-api-key": process.env["ONE_AUTO_API_KEY"],
        "Content-Type": "application/json",
      },
    };

    axios(config)
      .then(function (response) {
        res.send(response.data);
      })
      .catch(function (error) {
        console.log(error);
        res.status(404).send({ message: "Registration number not found" });
      });
  }
);

// ONE AUTO API - Car Guide - MOT
app.get(
  "/api/v1/oneautoapi/carguide/mot/:registrationNumber",
  async (req, res) => {
    console.log("ﷺ ﷽");
    var config = {
      method: "get",
      url:
        process.env["ONE_AUTO_API_URL"] +
        `/carguide/mothistoryandpredictions?vehicle_registration_mark=${req.params.registrationNumber.toString()}`,
      headers: {
        "x-api-key": process.env["ONE_AUTO_API_KEY"],
        "Content-Type": "application/json",
      },
    };

    axios(config)
      .then(function (response) {
        res.send(response.data);
      })
      .catch(function (error) {
        console.log(error);
        res.status(404).send({ message: "Registration number not found" });
      });
  }
);

// ONE AUTO API - Autotrader - Valuation
app.get(
  "/api/v1/oneautoapi/autotrader/valuation/:registrationNumber/:currentMileage/:vehicleCondition",
  async (req, res) => {
    console.log("ﷺ ﷽");
    var config = {
      method: "get",
      url:
        process.env["ONE_AUTO_API_URL"] +
        `/autotrader/valuationfromvrm?vehicle_registration_mark=${req.params.registrationNumber.toString()}&current_mileage=${req.params.currentMileage.toString()}&vehicle_condition=${req.params.vehicleCondition.toString()}`,
      headers: {
        "x-api-key": process.env["ONE_AUTO_API_KEY"],
        "Content-Type": "application/json",
      },
    };

    axios(config)
      .then(function (response) {
        res.send(response.data);
      })
      .catch(function (error) {
        console.log(error);
        res.status(404).send({ message: "Registration number not found" });
      });
  }
);

// STRIPE API - Create Payment Intent
app.post("/api/v1/stripe/create-payment-intent", async (req, res) => {
  console.log("ﷺ ﷽");
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

// STRIPE API - Webhook
app.post("/api/v1/stripe/webhook", (req, res) => {
  console.log("ﷺ ﷽");
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

      fetchAndStoreOneAutoAPI(email, vehicleFreeData, paymentId)
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

// PAYPAL API - Create Order
app.post("/api/v1/paypal/create-paypal-order", async (req, res) => {
  console.log("ﷺ ﷽");
  try {
    const order = await createOrder(req.body);
    res.json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// PAYPAL API - Capture Order
app.post("/api/v1/paypal/capture-paypal-order", async (req, resMain) => {
  console.log("ﷺ ﷽");
  const { orderID, email, vehicleFreeData } = req.body;
  try {
    await capturePayment(orderID).then((res) => {
      if (res.status === "COMPLETED") {
        const vehicleData = {
          RegistrationNumber: vehicleFreeData.registrationNumber,
          TaxStatus: vehicleFreeData.taxStatus,
          TaxDueDate: vehicleFreeData.taxDueDate,
          MotStatus: vehicleFreeData.motStatus,
          Make: vehicleFreeData.make,
          YearOfManufacture: vehicleFreeData.yearOfManufacture,
          EngineCapacity: vehicleFreeData.engineCapacity,
          Co2Emissions: vehicleFreeData.co2Emissions,
          FuelType: vehicleFreeData.fuelType,
          MarkedForExport: vehicleFreeData.markedForExport,
          Colour: vehicleFreeData.colour,
          TypeApproval: vehicleFreeData.typeApproval,
          DateOfLastV5CIssued: vehicleFreeData.dateOfLastV5CIssued,
          MotExpiryDate: vehicleFreeData.motExpiryDate,
          Wheelplan: vehicleFreeData.wheelplan,
          MonthOfFirstRegistration: vehicleFreeData.monthOfFirstRegistration,
        };
        fetchAndStoreVehicleData(
          email,
          vehicleData,
          orderID,
          process.env["UKVD_API_KEY"]
        )
          .then(() => {
            resMain.status(200).send("Vehicle data stored");
          })
          .catch((err) => {
            console.error(`Error handling success: ${err}`);
            resMain.status(500).send(err.message);
          });
      } else {
        resMain.status(500).send("Payment not completed");
      }
    });
  } catch (err) {
    resMain.status(500).send(err.message);
  }
});

// FIREBASE API - Download Report
app.post("/api/v1/firebase/download-report", async (req, res) => {
  console.log("ﷺ ﷽");
  try {
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

// EMAIL API - Send Report
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

app.post("/api/v1/");

export default app;
