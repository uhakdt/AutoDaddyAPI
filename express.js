require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

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

app.use(cors({ origin: process.env["CLIENT_DOMAIN"] }));

module.exports = app;