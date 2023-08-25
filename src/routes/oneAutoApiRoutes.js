import express from "express";
import axios from "axios";

const router = express.Router();

// ONE AUTO API - UK Vehicle Data
router.get("/ukvd/:registrationNumber", async (req, res) => {
  var config = {
    method: "get",
    url:
      process.env["ONE_AUTO_API_URL"] +
      `/ukvehicledata/vehicleandmodeldetailsfromvrm?vehicle_registration_mark=${req.params.registrationNumber.toString()}`,
    headers: {
      "x-api-key": process.env["ONE_AUTO_API_KEY"],
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

// ONE AUTO API - Experian
router.get("/experian/:registrationNumber", async (req, res) => {
  var config = {
    method: "get",
    url:
      process.env["ONE_AUTO_API_URL"] +
      `/experian/autocheck/v2?vehicle_registration_mark=${req.params.registrationNumber.toString()}`,
    headers: {
      "x-api-key": process.env["ONE_AUTO_API_KEY"],
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

// ONE AUTO API - Car Guide - Salvage Check
router.get("/carguide/salvagecheck/:registrationNumber", async (req, res) => {
  var config = {
    method: "get",
    url:
      process.env["ONE_AUTO_API_URL"] +
      `/carguide/salvagecheck?vehicle_registration_mark=${req.params.registrationNumber.toString()}`,
    headers: {
      "x-api-key": process.env["ONE_AUTO_API_KEY"],
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

// ONE AUTO API - Car Guide - MOT
router.get("/carguide/mot/:registrationNumber", async (req, res) => {
  var config = {
    method: "get",
    url:
      process.env["ONE_AUTO_API_URL"] +
      `/carguide/mothistoryandpredictions?vehicle_registration_mark=${req.params.registrationNumber.toString()}`,
    headers: {
      "x-api-key": process.env["ONE_AUTO_API_KEY"],
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

// ONE AUTO API - Autotrader - Valuation
router.get(
  "/autotrader/valuation/:registrationNumber/:currentMileage/:vehicleCondition",
  async (req, res) => {
    var config = {
      method: "get",
      url:
        process.env["ONE_AUTO_API_URL"] +
        `/autotrader/valuationfromvrm?vehicle_registration_mark=${req.params.registrationNumber.toString()}&current_mileage=${req.params.currentMileage.toString()}&vehicle_condition=${req.params.vehicleCondition.toString()}`,
      headers: {
        "x-api-key": process.env["ONE_AUTO_API_KEY"],
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
  }
);

export default router;
