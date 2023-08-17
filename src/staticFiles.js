import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = path.resolve(__dirname, "..");

const serveWellKnownStaticFile = express.static(
  path.join(rootDir, ".well-known")
);

export default serveWellKnownStaticFile;
