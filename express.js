import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  bodyParser.json({
    verify: (req, _, buf) => {
      try {
        JSON.parse(buf.toString());
        req.rawBody = buf.toString();
      } catch (e) {
        console.error(`Invalid JSON: ${buf.toString()}`);
      }
    },
  })(req, res, next);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));

app.use(cors({ origin: process.env["CLIENT_DOMAIN"] }));

export default app;
