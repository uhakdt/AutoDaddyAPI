import sgMail from "@sendgrid/mail";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const readEmailTemplate = (url) => {
  const template = fs.readFileSync(path.join(__dirname, "./templates/emailTemplate.html"), "utf8");
  return template.replace("{{url}}", url);
};

const sendEmail = async (email, url) => {
  try {
    const emailTemplate = readEmailTemplate(url);

    const msg = {
      to: email,
      from: "main@autodaddy.co.uk",
      subject: "AutoDaddy - Your Report is ready",
      html: emailTemplate,
    };

    const result = await sgMail.send(msg);
    return result;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send email.");
  }
};

export default sendEmail;
