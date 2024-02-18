import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import parseBody from "./parseBody.js";
import serveWellKnownStaticFile from "./staticFiles.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: "/api/v1/chat",
  cors: {
    origin: ["https://autodaddy.co.uk", "https://autodaddy.loca.lt", "http://localhost:3000", "https://autodaddy-dev.netlify.app"],
  },
});

app.use(parseBody);

app.use("/.well-known", serveWellKnownStaticFile);

app.use(compression());

app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  })
);

app.use(hpp());

app.use(
  cors({
    origin: ["https://autodaddy.co.uk", "https://autodaddy.loca.lt", "http://localhost:3000", "https://autodaddy-dev.netlify.app"],
  })
);

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 5 requests per windowMs
  handler: function (req, res, next) {
    console.error(`Rate limit exceeded: ${req.ip}`);
    res.status(429).send("Too many requests, please try again later.");
  },
});

app.use(limiter);

export { app, server, io };
