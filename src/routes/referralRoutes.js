import express from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../firebase.js";
import sendEmail from "../email.js";

const router = express.Router();
const clientDomain = process.env.CLIENT_DOMAIN;

router.post("/send_referral_link", async (req, res) => {
  const { uid, email, sortCode, accountNumber } = req.body;

  try {
    const referralCode = uuidv4();
    const referralLink = `${clientDomain}/?referralCode=${referralCode}`;

    const userRef = db.collection("users").doc(uid);
    await userRef.set(
      {
        referralCode: referralCode,
        sortCode: sortCode,
        accountNumber: accountNumber,
      },
      { merge: true }
    );

    await sendEmail(email, referralLink);

    res.send({ message: "Referral link sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
});

export default router;
