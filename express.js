import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import logger from "./logger.js";
import parseBody from "./parseBody.js";
import serveWellKnownStaticFile from "./staticFiles.js";

dotenv.config();

const app = express();

app.use(parseBody);

app.use("/.well-known", serveWellKnownStaticFile);

app.use(logger);

app.use(compression());

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

app.use(hpp());

app.use(cors({ origin: "*" }));

export default app;
