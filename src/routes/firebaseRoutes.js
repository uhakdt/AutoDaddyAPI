import express from "express";
import { db, storage } from "../firebase.js";

const router = express.Router();

// FIREBASE API - Download Report
router.post("/download-report", async (req, res) => {
  console.log("ﷺ ﷽");
  try {
    // Create signed URL
    const bucket = storage.bucket();
    const [url] = await bucket
      .file("AutoDaddy_Sample_Report.pdf")
      .getSignedUrl({
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
