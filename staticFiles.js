import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serveWellKnownStaticFile = express.static(
  path.join(__dirname, ".well-known")
);

export default serveWellKnownStaticFile;
