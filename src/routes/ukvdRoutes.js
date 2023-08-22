import express from "express";
import axios from "axios";
import { log, logException } from "../logger.js"; // Adjust the path to your logger

const router = express.Router();

router.get("/vdicheckfull/:registrationNumber", async (req, res) => {
  fetchDataFromUKVD(req, res, process.env["UKVD_API_URL_VDI_CHECK_FULL"]);
});

router.get("/vehicleandmothistory/:registrationNumber", async (req, res) => {
  fetchDataFromUKVD(
    req,
    res,
    process.env["UKVD_API_URL_VEHICLE_AND_MOT_HISTORY"]
  );
});

router.get("/vehicleimagedata/:registrationNumber", async (req, res) => {
  fetchDataFromUKVD(req, res, process.env["UKVD_API_URL_VEHICLE_IMAGE_DATA"]);
});

const fetchDataFromUKVD = async (req, res, baseUrl) => {
  log(
    `Fetching data for registration number: ${req.params.registrationNumber}`
  );

  const config = {
    method: "get",
    url: baseUrl + req.params.registrationNumber,
    headers: {
      "Content-Type": "application/json",
    },
  };

  try {
    const response = await axios(config);
    res.send(response.data);
  } catch (error) {
    logException(error);

    const errorMessage =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : "Registration number not found";

    res.status(404).send({ message: errorMessage });
  }
};

export default router;
