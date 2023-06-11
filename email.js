const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const oAuth2Client = new google.auth.OAuth2(
  process.env["GCP_GMAIL_CLIENT_ID"],
  process.env["GCP_GMAIL_CLIENT_SECRET"],
  process.env["GCP_GMAIL_REDIRECT_URI"]
);

oAuth2Client.setCredentials({
  refresh_token: process.env["GCP_GMAIL_REFRESH_TOKEN"],
});

const sendEmail = async (email, orderId, url) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
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

    // Read the email template
    let emailTemplate = fs.readFileSync(
      path.join(__dirname, "./emailTemplate.html"),
      "utf8"
    );

    // Replace the placeholder with the actual link
    emailTemplate = emailTemplate.replace("{{url}}", url);

    const mailOptions = {
      from: "X Y <uhakdt@gmail.com>",
      to: email,
      subject: "AutoDaddy - Your order is ready",
      html: emailTemplate,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error(error);
  }
};

module.exports = { sendEmail };