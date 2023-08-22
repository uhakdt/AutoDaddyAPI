import { google } from "googleapis";
import nodemailer from "nodemailer";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { log, logException } from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const oAuth2Client = new google.auth.OAuth2(
  process.env["GCP_GMAIL_CLIENT_ID"],
  process.env["GCP_GMAIL_CLIENT_SECRET"],
  process.env["GCP_GMAIL_REDIRECT_URI"]
);

oAuth2Client.setCredentials({
  refresh_token: process.env["GCP_GMAIL_REFRESH_TOKEN"],
});

const createTransport = async () => {
  const accessToken = await oAuth2Client.getAccessToken();
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "uhakdt@gmail.com",
      clientId: process.env["GCP_GMAIL_CLIENT_ID"],
      clientSecret: process.env["GCP_GMAIL_CLIENT_SECRET"],
      refreshToken: process.env["GCP_GMAIL_REFRESH_TOKEN"],
      accessToken: accessToken,
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
    log("Attempting to send email...");

    const transport = await createTransport();
    const emailTemplate = readEmailTemplate(url);

    const mailOptions = {
      from: "AutoDaddy <uhakdt@gmail.com>",
      to: email,
      subject: "AutoDaddy - Your Report is ready",
      html: emailTemplate,
    };

    const result = await transport.sendMail(mailOptions);
    log("Email sent successfully.");

    return result;
  } catch (error) {
    logException(error);
    throw new Error("Failed to send email.");
  }
};

export default sendEmail;
