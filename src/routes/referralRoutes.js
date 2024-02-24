import express from "express";
import { v4 as uuidv4 } from "uuid";
import { db } from "../firebase.js";
import { sendEmail, sendEmailReferralUsed } from "../email.js";

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

router.post("/send_money_to_user", async (req, res) => {
  const { referralCode, uid, email: customerEmail } = req.body;

  try {
    const customerRef = db.collection("users").doc(uid);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      return res.status(404).send({ message: "Customer not found." });
    }

    const customerData = customerDoc.data();
    const referralCodes = customerData.referralCodes || [];

    if (referralCodes.includes(referralCode)) {
      return res.status(204).send();
    }

    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("referralCode", "==", referralCode)
      .get();

    if (snapshot.empty) {
      return res.status(404).send({ message: "Referral code not found." });
    }

    let salesAgentEmail, sortCode, accountNumber;

    snapshot.forEach((doc) => {
      const data = doc.data();
      salesAgentEmail = data.email;
      sortCode = data.sortCode;
      accountNumber = data.accountNumber;
    });

    await sendEmailReferralUsed(
      "uhakdt@gmail.com",
      customerEmail,
      uid,
      salesAgentEmail,
      sortCode,
      accountNumber
    );

    referralCodes.push(referralCode);
    await customerRef.set({ referralCodes: referralCodes }, { merge: true });

    res.send({ message: "Referral bonus processed successfully." });
  } catch (error) {
    console.error("Error processing referral bonus:", error);
    res.status(500).send({ error: error.message });
  }
});

export default router;
