import nodemailer from "nodemailer";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createTransport = () => {
  return nodemailer.createTransport({
    host: "smtp.zoho.eu",
    port: 465,
    secure: true,
    auth: {
      user: "main@autodaddy.co.uk",
      pass: process.env["ZOHO_PASSWORD"],
    },
  });
};

const readEmailTemplate = (url) => {
  const template = fs.readFileSync(
    path.join(__dirname, "./templates/emailTemplate.html"),
    "utf8"
  );
  return template.replace("{{url}}", url);
};

const sendEmail = async (email, url) => {
  try {
    const transport = createTransport();
    const emailTemplate = readEmailTemplate(url);

    const mailOptions = {
      from: "AutoDaddy <main@autodaddy.co.uk>",
      to: email,
      subject: "AutoDaddy - Your Report is ready",
      html: emailTemplate,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send email.");
  }
};

export default sendEmail;
