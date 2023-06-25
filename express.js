import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import morgan from "morgan";
import compression from "compression";
import rfs from "rotating-file-stream";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

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

// LOGGING
var pad = (num) => (num > 9 ? "" : "0") + num;
var generator = (time, index) => {
  if (!time) time = new Date();

  var month = pad(time.getMonth() + 1);
  var day = pad(time.getDate());
  var year = time.getFullYear();
  return `${day}-${month}-${year}.log`;
};
var accessLogStream = rfs.createStream(generator, {
  interval: "1d",
  path: path.join(__dirname, "logs"),
  maxSize: "10M",
  maxFiles: 10,
});
morgan.token("datetime", () => {
  const currentDateTime = new Date().toLocaleString();
  return currentDateTime;
});
app.use(
  morgan("[:datetime] :status :url :method :response-time ms", {
    stream: accessLogStream,
  })
);

app.use(compression());

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

app.use(hpp());

app.use(cors({ origin: process.env["CLIENT_DOMAIN"] }));

export default app;
