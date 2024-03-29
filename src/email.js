import sgMail from "@sendgrid/mail";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (email, url) => {
  try {
    const msg = {
      to: email,
      from: "main@autodaddy.co.uk",
      template_id: "d-05c2d8766a174acf9a3fb243583a163d",
      dynamic_template_data: {
        WebLink: url,
      },
      tracking_settings: {
        click_tracking: {
          enable: false,
          enable_text: false,
        },
      },
    };

    const result = await sgMail.send(msg);
    console.log("Email sent successfully");
    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email.");
  }
};

const sendEmailReferralLink = async (email, url) => {
  try {
    const msg = {
      to: email,
      from: "main@autodaddy.co.uk",
      template_id: "d-97fec23e1d6647fa9950a0b0153a4b9a",
      dynamic_template_data: {
        ReferralLink: url,
      },
      tracking_settings: {
        click_tracking: {
          enable: false,
          enable_text: false,
        },
      },
    };

    const result = await sgMail.send(msg);
    console.log("Referral Email sent successfully");
    return result;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email.");
  }
};

const sendEmailReferralUsed = async (
  recipientEmail,
  customerEmail,
  customerUid,
  salesAgentEmail,
  sortCode,
  accountNumber
) => {
  try {
    console.log("Preparing to send referral used email to: ", recipientEmail);

    const msg = {
      to: recipientEmail,
      from: "main@autodaddy.co.uk",
      subject: "Referral Code Used",
      text: `A referral code has been used.\n\nCustomer Email: ${customerEmail}\nSales Agent Email: ${salesAgentEmail}\nSort Code: ${sortCode}\nAccount Number: ${accountNumber}`,
      html: `<strong>A referral code has been used.</strong><br><br>
             <strong>Customer Email:</strong> ${customerEmail}<br>
             <strong>Customer UID:</strong> ${customerUid}<br>
             <strong>Sales Agent Email:</strong> ${salesAgentEmail}<br>
             <strong>Sort Code:</strong> ${sortCode}<br>
             <strong>Account Number:</strong> ${accountNumber}<br>`,
      tracking_settings: {
        click_tracking: {
          enable: false,
          enable_text: false,
        },
      },
    };

    const result = await sgMail.send(msg);
    console.log("Referral used email sent successfully");
    return result;
  } catch (error) {
    console.error("Failed to send referral used email:", error);
    throw new Error("Failed to send referral used email.");
  }
};

export { sendEmail, sendEmailReferralUsed, sendEmailReferralLink };
