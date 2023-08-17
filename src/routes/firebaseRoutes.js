import express from "express";
import { db, storage } from "../firebase.js";
import crypto from "crypto";

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

router.post("/data-deletion", async (req, res) => {
  const signed_request = req.body.signed_request;
  const data = parse_signed_request(signed_request);

  if (!data) {
    return res.status(400).send("Invalid signed request.");
  }

  const user_id = data.user_id;

  try {
    await admin.auth().deleteUser(user_id);

    const confirmation_code = generateUniqueCode();
    const status_url = `https://www.autodaddy.co.uk/deletion?id=${confirmation_code}`;

    res.json({
      url: status_url,
      confirmation_code: confirmation_code,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send("Error deleting user.");
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
    console.error("Bad Signed JSON signature!");
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
