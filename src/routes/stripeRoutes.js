import express from "express";
import { stripe, endpointSecret } from "../stripe.js";
import { fetchAndStoreVehicleData } from "../functions/fetchAndStore.js";

const router = express.Router();

// STRIPE API - Create Payment Intent
router.post("/create-payment-intent", async (req, res) => {
  const { price, vehicleFreeData } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: price,
    currency: "gbp",
    automatic_payment_methods: {
      enabled: true,
    },
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
    paymentIntentId: paymentIntent.id,
  });
});

// STRIPE API - Webhook
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
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

      try {
        const result = await fetchAndStoreVehicleData(
          event["data"]["object"]["metadata"]["uid"],
          event["data"]["object"]["receipt_email"],
          vehicleFreeData,
          paymentId
        );
        if (result.success) {
          res.json({ received: true });
        }
      } catch (err) {
        console.error(`Error handling success: ${err}`);
        res.status(500).send(err.message);
      }
      break;
    }
    default:
      return res.status(400).end();
  }
});

router.post("/update-payment-intent", async (req, res) => {
  const { paymentIntentId, uid } = req.body;

  try {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { uid: uid },
    });

    res.status(204).end();
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

export default router;