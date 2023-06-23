import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
const stripe = Stripe(process.env["STRIPE_SECRET_KEY"]);

const endpointSecret = process.env["STRIPE_SECRET_WEBHOOK"];

export { stripe, endpointSecret };
