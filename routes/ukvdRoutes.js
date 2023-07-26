import express from "express";
import axios from "axios";

const router = express.Router();

// UKVD API - VDI Check Full
router.get("/vdicheckfull/:registrationNumber", async (req, res) => {
  console.log("ﷺ ﷽");
  var config = {
    method: "get",
    url:
      process.env["UKVD_API_URL_VDI_CHECK_FULL"] +
      req.params.registrationNumber.toString(),
    headers: {
      "Content-Type": "application/json",
    },
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.status(404).send({ message: "Registration number not found" });
    });
});

// UKVD API - Vehicle and MOT History
router.get("/vehicleandmothistory/:registrationNumber", async (req, res) => {
  console.log("ﷺ ﷽");
  var config = {
    method: "get",
    url:
      process.env["UKVD_API_URL_VEHICLE_AND_MOT_HISTORY"] +
      req.params.registrationNumber.toString(),
    headers: {
      "Content-Type": "application/json",
    },
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.status(404).send({ message: "Registration number not found" });
    });
});

// UKVD API - Vehicle Image Data
router.get("/vehicleimagedata/:registrationNumber", async (req, res) => {
  console.log("ﷺ ﷽");
  var config = {
    method: "get",
    url:
      process.env["UKVD_API_URL_VEHICLE_IMAGE_DATA"] +
      req.params.registrationNumber.toString(),
    headers: {
      "Content-Type": "application/json",
    },
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
      res.status(404).send({ message: "Registration number not found" });
    });
});

export default router;
