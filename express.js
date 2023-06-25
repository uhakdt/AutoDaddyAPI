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

// Custom log file name format
var pad = (num) => (num > 9 ? "" : "0") + num;
var generator = (time, index) => {
  if (!time) time = new Date(); // Use current date if time is not provided

  // Log file name: dd-mm-yyyy.log
  var month = pad(time.getMonth() + 1);
  var day = pad(time.getDate());
  var year = time.getFullYear();
  return `${day}-${month}-${year}.log`;
};

// create a rotating write stream
var accessLogStream = rfs.createStream(generator, {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "logs"),
  maxSize: "10M", // (10 * 1MB) cap at 10 files
  maxFiles: 10, // cap at 10 files
});

// Custom morgan token
morgan.token("datetime", () => {
  const currentDateTime = new Date().toLocaleString();
  return currentDateTime;
});

// Setup the logger
app.use(
  morgan("[:datetime] :status :url :method :response-time ms", {
    stream: accessLogStream,
  })
);

app.use(compression());

app.use(cors({ origin: process.env["CLIENT_DOMAIN"] }));

export default app;
