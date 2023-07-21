import express from "express";
import sendEmail from "../email.js";

const router = express.Router();

// EMAIL API - Send Report
router.post("/report", async (req, res) => {
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

export default router;
