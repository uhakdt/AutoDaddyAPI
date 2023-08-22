import express from "express";
import { db, storage } from "../firebase.js";
import crypto from "crypto";
import { log, logException, trackRequest } from "../logger.js";

const router = express.Router();

// FIREBASE API - Download Report
router.post("/download-report", async (req, res) => {
  try {
    log("Received request to download report.");

    // Create signed URL
    const bucket = storage.bucket();
    const [url] = await bucket
      .file("AutoDaddy_Sample_Report.pdf")
      .getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60, // 1 hour
      });

    res.json({ url });

    trackRequest({
      name: "POST /download-report",
      resultCode: 200,
      success: true,
    });
  } catch (error) {
    logException(error);
    res.status(500).send("Error getting download URL");

    trackRequest({
      name: "POST /download-report",
      resultCode: 500,
      success: false,
    });
  }
});

router.post("/data-deletion", async (req, res) => {
  try {
    log("Received request for data deletion.");

    const data = parse_signed_request(req.body.signed_request);

    if (!data) {
      throw new Error("Invalid signed request.");
    }

    await admin.auth().deleteUser(data.user_id);

    const confirmation_code = generateUniqueCode();
    const status_url = `https://www.autodaddy.co.uk/deletion?id=${confirmation_code}`;

    res.json({
      url: status_url,
      confirmation_code: confirmation_code,
    });

    trackRequest({
      name: "POST /data-deletion",
      resultCode: 200,
      success: true,
    });
  } catch (error) {
    logException(error);

    if (error.message === "Invalid signed request.") {
      res.status(400).send(error.message);
      trackRequest({
        name: "POST /data-deletion",
        resultCode: 400,
        success: false,
      });
    } else {
      res.status(500).send("Error deleting user.");
      trackRequest({
        name: "POST /data-deletion",
        resultCode: 500,
        success: false,
      });
    }
  }
});

function parse_signed_request(signed_request) {
  const [encoded_sig, payload] = signed_request.split(".");
  const secret = process.env["FACEBOOK_APP_SECRET"];

  const sig = base64_url_decode(encoded_sig);
  const data = JSON.parse(base64_url_decode(payload));

  const expected_sig = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");

  if (sig !== expected_sig) {
    logException(new Error("Bad Signed JSON signature!"));
    return null;
  }

  return data;
}

function base64_url_decode(input) {
  return Buffer.from(
    input.replace("-", "+").replace("_", "/"),
    "base64"
  ).toString("utf-8");
}

function generateUniqueCode() {
  return crypto.randomBytes(16).toString("hex");
}

export default router;
