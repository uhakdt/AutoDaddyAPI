import express from "express";
import { db, storage } from "../firebase.js";

const router = express.Router();

// FIREBASE API - Download Report
router.post("/download-report", async (req, res) => {
  console.log("ﷺ ﷽");
  try {
    const { orderId, vehicleRegMark, uid } = req.body;

    const orderSnapshot = await db.collection("orders").doc(orderId).get();

    if (!orderSnapshot.exists) {
      return res.status(404).send("Order not found");
    }

    const order = orderSnapshot.data();

    // Check if this order belongs to the authenticated user
    if (order.uid !== uid) {
      return res.status(403).send("This order does not belong to you");
    }

    // Create file path
    const filePath = `user_files/${uid}/reports/${vehicleRegMark}_${orderId}.pdf`;

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

export default router;
