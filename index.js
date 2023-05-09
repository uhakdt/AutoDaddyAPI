const express = require("express");
const axios = require("axios");

const stripe = require("stripe")(
  "sk_test_51MkoADLJE9t4rWObnQV3ZeAJM7moXR7nDUe4KoaJDkulj219tB9V9l2u0EVu9gCGQUq8l9xBJAeL1IQ00l9hgQyt00b0vki7wT"
);

const app = express();

app.use(express.json());

// const YOUR_DOMAIN = 'https://AutoDaddyAPI.uhakdt.repl.co/api/v1';
const YOUR_DOMAIN = "http://localhost:4242";

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/api/v1/vehicledata/free/:registrationNumber", async (req, res) => {
  var config = {
    method: "post",
    url: "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    headers: {
      "x-api-key": "cMQncH4Szk8qpKoPQOlTQ5Cu9paQSp3KuNIcxzt0",
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      registrationNumber: req.params.registrationNumber.toString(),
    }),
  };

  axios(config)
    .then(function (response) {
      console.log(response.data);
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
  console.log("vehicledata/free endpoint hit");
});

app.post("/api/v1/vehicledata/basic", async (req, res) => {
  var config = {
    method: "get",
    url: "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    headers: {
      "x-api-key": "cMQncH4Szk8qpKoPQOlTQ5Cu9paQSp3KuNIcxzt0",
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      registrationNumber: req.body.registrationNumber.toString(),
    }),
  };

  axios(config)
    .then(function (response) {
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });

  console.log("vehicledata/basic endpoint hit");
});

app.post("/api/v1/vehicledata/full", async (req, res) => {
  const apiKey = "ad296227-c4a3-44e3-806b-476d634439e8";

  const packages = [
    "BatteryData",
    "FuelPriceData",
    "MotHistoryAndTaxStatusData",
    "MotHistoryData",
    "PostcodeLookup",
    "SpecAndOptionsData",
    "TyreData",
    "ValuationCanPrice",
    "ValuationData",
    "VdiCheckFull",
    "VehicleAndMotHistory",
    "VehicleData",
    "VehicleDataIRL",
    "VehicleImageData",
    "VehicleTaxData",
  ];

  const fetchData = async (packageName, vehicleRegMark, apiKey) => {
    const url = `https://uk1.ukvehicledata.co.uk/api/datapackage/${packageName}?v=2&api_nullitems=1&key_vrm=${vehicleRegMark}&auth_apikey=${apiKey}`;
    const response = await axios.get(url);

    if (response.status !== 200) {
      throw new Error("Network response was not ok");
    }

    return response.data;
  };

  const fetchAllData = async (packages, vehicleRegMark, apiKey) => {
    const data = await Promise.all(
      packages.map((packageName) =>
        fetchData(packageName, vehicleRegMark, apiKey)
      )
    );

    return Object.assign({}, ...data);
  };

  fetchAllData(packages, req.body.registrationNumber.toString(), apiKey)
    .then((data) => {
      console.log("Data fetched successfully!");
      console.log(data);
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });

  console.log("vehicledata/full endpoint hit");
});

app.get("/api/v1/chatgpt", async (req, res) => {});

app.post("/api/v1/payment/:tier", async (req, res) => {
  let priceId;

  if (req.params.tier.toString() === "basic") {
    priceId = "price_1N5fRvLJE9t4rWObAZejM2KP";
  } else if (req.params.tier.toString() === "full") {
    priceId = "price_1N5fSNLJE9t4rWObyuziwRXa";
  } else {
    res.status(400).send("Invalid tier");
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${YOUR_DOMAIN}?success=true`,
      cancel_url: `${YOUR_DOMAIN}?canceled=true`,
      automatic_tax: { enabled: true },
    });

    res.redirect(303, session.url);
  } catch (error) {
    console.error("Error creating Stripe session:", error);
    res.status(500).send("Failed to create Stripe session");
  }
});

app.get("/", (req, res) => {
  res.send("Hello");
});

const port = 4242;
app.listen(port, () => console.log(`Listening on port ${port}...`));
