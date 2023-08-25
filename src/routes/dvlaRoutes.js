import express from "express";
import axios from "axios";

const router = express.Router();

// DVLA - Vehicle Free Data
router.post("/:registrationNumber", async (req, res) => {
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

    console.log({
      name: `POST /:registrationNumber - ${req.params.registrationNumber}`,
      resultCode: 200,
      success: true,
    });
  } catch (error) {
    if (error.response) {
      console.error(error.response.data);

      if (error.response.status === 404) {
        res.status(404).send({ message: "Registration number not found" });
      } else {
        res.status(error.response.status).send(error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from the DVLA API.");
      res
        .status(500)
        .send({ message: "Failed to get a response from the DVLA API." });
    } else {
      console.error(error.message);
      res.status(500).send({ message: "Internal server error." });
    }

    console.log({
      name: `POST /:registrationNumber - ${req.params.registrationNumber}`,
      resultCode: (error.response && error.response.status) || 500,
      success: false,
    });
  }
});

export default router;
