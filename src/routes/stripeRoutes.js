import express from "express";
import { stripe, endpointSecret } from "../stripe.js";
import { fetchAndStoreVehicleData } from "../functions/fetchAndStore.js";

const router = express.Router();

// STRIPE - Create Payment Intent
router.post("/create-payment-intent", async (req, res) => {
  try {
    const paymentIntent = await createPaymentIntent(req.body);

    console.log(`Payment intent created: ${paymentIntent.id}`);

    res.send({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
});

// STRIPE - Webhook
router.post("/webhook", async (req, res) => {
  try {
    const event = constructEventFromRequest(req);

    if (event.type === "payment_intent.succeeded") {
      await handlePaymentIntentSucceeded(event);
      res.json({ received: true });
    } else {
      res.status(400).send("Unsupported event type");
    }
  } catch (error) {
    console.error(error);
    res.status(error.httpStatusCode || 500).send(error.message);
  }
});

// STRIPE - Update Payment Intent
router.post("/update-payment-intent", async (req, res) => {
  try {
    await updatePaymentIntent(req.body);
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
});

async function createPaymentIntent(body) {
  const { price, vehicleFreeData } = body;

  return await stripe.paymentIntents.create({
    amount: price,
    currency: "gbp",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: vehicleFreeData,
  });
}

function constructEventFromRequest(req) {
  const sig = req.headers["stripe-signature"];

  return stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
}

async function handlePaymentIntentSucceeded(event) {
  const vehicleFreeData = extractMetadata(event);
  const paymentId = event.data.object.id;

  await fetchAndStoreVehicleData(
    event.data.object.metadata.uid,
    event.data.object.receipt_email,
    vehicleFreeData,
    paymentId
  );
}

function extractMetadata(event) {
  const metadata = event.data.object.metadata;

  return {
    RegistrationNumber: metadata.registrationNumber,
    TaxStatus: metadata.taxStatus,
    TaxDueDate: metadata.taxDueDate,
    MotStatus: metadata.motStatus,
    Make: metadata.make,
    YearOfManufacture: metadata.yearOfManufacture,
    EngineCapacity: metadata.engineCapacity,
    Co2Emissions: metadata.co2Emissions,
    FuelType: metadata.fuelType,
    MarkedForExport: metadata.markedForExport,
    Colour: metadata.colour,
    TypeApproval: metadata.typeApproval,
    DateOfLastV5CIssued: metadata.dateOfLastV5CIssued,
    MotExpiryDate: metadata.motExpiryDate,
    Wheelplan: metadata.wheelplan,
    MonthOfFirstRegistration: metadata.monthOfFirstRegistration,
  };
}

async function updatePaymentIntent(body) {
  const { paymentIntentId, uid } = body;

  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: { uid: uid },
  });
}

export default router;
