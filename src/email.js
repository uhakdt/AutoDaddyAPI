import sgMail from "@sendgrid/mail";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (email, url) => {
  try {
    console.log("Sending email to: ", email);
    console.log("Email URL: ", url);

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

export default sendEmail;
