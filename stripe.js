require("dotenv").config();
const stripe = require("stripe")(process.env["STRIPE_SECRET_KEY"]);
const endpointSecret = process.env["STRIPE_SECRET_WEBHOOK"];

module.exports = { stripe, endpointSecret };
