const app = require("./express");
const { stripe, endpointSecret } = require("./stripe");
const axios = require("axios");
const fetchAndStoreVehicleData = require("./functions/fetchAndStore");

app.get("/", (req, res) => {
  res.send("Hello World!");
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

module.exports = app;
