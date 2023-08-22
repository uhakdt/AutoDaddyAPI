import express from "express";
import axios from "axios";
import { log, logException, trackRequest } from "../logger.js";

const router = express.Router();

// DVLA - Vehicle Free Data
router.post("/:registrationNumber", async (req, res) => {
  log(
    `Received request for registration number: ${req.params.registrationNumber}`
  );

  var config = {
    method: "post",
    url: process.env["VEHICLE_FREE_DATA_URL"],
    headers: {
      "x-api-key": process.env["VEHICLE_FREE_DATA_API_KEY"],
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      registrationNumber: req.params.registrationNumber.toString(),
    }),
  };

  try {
    const response = await axios(config);
    res.send(response.data);

    trackRequest({
      name: `POST /:registrationNumber - ${req.params.registrationNumber}`,
      resultCode: 200,
      success: true,
    });
  } catch (error) {
    if (error.response) {
      logException(error.response.data);

      if (error.response.status === 404) {
        res.status(404).send({ message: "Registration number not found" });
      } else {
        res.status(error.response.status).send(error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      logException("No response received from the DVLA API.");
      res
        .status(500)
        .send({ message: "Failed to get a response from the DVLA API." });
    } else {
      logException(error.message);
      res.status(500).send({ message: "Internal server error." });
    }

    trackRequest({
      name: `POST /:registrationNumber - ${req.params.registrationNumber}`,
      resultCode: (error.response && error.response.status) || 500,
      success: false,
    });
  }
});

export default router;
