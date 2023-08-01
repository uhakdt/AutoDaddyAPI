import express from "express";
import { fetchAndStoreVehicleData } from "../functions/fetchAndStore.js";
import { createOrder, capturePayment } from "../paypal.js";

const router = express.Router();

// PAYPAL API - Create Order
router.post("/create-paypal-order", async (req, res) => {
  console.log("ﷺ ﷽");
  try {
    const order = await createOrder(req.body);
    res.json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// PAYPAL API - Capture Order
router.post("/capture-paypal-order", async (req, resMain) => {
  console.log("ﷺ ﷽");
  const { orderID, email, vehicleFreeData } = req.body;
  try {
    const paymentResult = await capturePayment(orderID);
    console.log(paymentResult);
    if (paymentResult.status === "COMPLETED") {
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

      try {
        await fetchAndStoreVehicleData(email, vehicleData, paymentResult.id);
        console.log("Success");
        resMain.json({ received: true });
      } catch (err) {
        console.error(`Error handling success: ${err}`);
        resMain.status(500).send(err.message);
      }
    } else {
      resMain.status(500).send("Payment not completed");
    }
  } catch (err) {
    resMain.status(500).send(err.message);
  }
});

export default router;
