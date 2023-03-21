const express = require("express");
const axios = require("axios");

const stripe = require("stripe")(
  "sk_test_51MkoADLJE9t4rWObnQV3ZeAJM7moXR7nDUe4KoaJDkulj219tB9V9l2u0EVu9gCGQUq8l9xBJAeL1IQ00l9hgQyt00b0vki7wT"
);

const app = express();

app.use(express.json());

// const YOUR_DOMAIN = 'https://AutoDaddyAPI.uhakdt.repl.co/api/v1';
const YOUR_DOMAIN = "http://localhost:4242";

sampleInitialData = {
  TestResults: [
    {
      TestNumber: "5648 0619 9154",
      TestDate: "15/07/2009",
      TestResult: "Pass",
      OdometerReading: 88259,
      TestNumber: "5648 0619 9154",
      AdvisoryNoticeList: [],
      FailureReasonList: [],
    },
    {
      TestNumber: "2846 8599 9468",
      TestDate: "17/06/2008",
      TestResult: "Pass",
      OdometerReading: 85974,
      TestNumber: "2846 8599 9468",
      AdvisoryNoticeList: [],
      FailureReasonList: [],
    },
  ],
};

sampleBasicData = {
  TestResults: [
    {
      TestNumber: "5648 0619 9154",
      TestDate: "15/07/2009",
      TestResult: "Pass",
      OdometerReading: 88259,
      TestNumber: "5648 0619 9154",
      AdvisoryNoticeList: [],
      FailureReasonList: [],
      TestResults: {
        TestDate: "15/07/2009",
        ExpiryDate: null,
        TestResult: "Pass",
        OdometerReading: 88259,
        TestNumber: "5648 0619 9154",
      },
    },
    {
      TestNumber: "2846 8599 9468",
      TestDate: "17/06/2008",
      TestResult: "Pass",
      OdometerReading: 85974,
      TestNumber: "2846 8599 9468",
      AdvisoryNoticeList: [],
      FailureReasonList: [],
      TestResults: {
        TestDate: "15/07/2009",
        ExpiryDate: null,
        TestResult: "Pass",
        OdometerReading: 88259,
        TestNumber: "5648 0619 9154",
      },
    },
  ],
};

sampleFullData = {
  DataItems: {
    TechnicalDetails: {
      Dimensions: {
        UnladenWeight: null,
        RigidArtic: "RIGID1",
        BodyShape: "NA",
        PayloadVolume: null,
        PayloadWeight: null,
        Height: 1707.0,
        NumberOfSeats: 5,
        KerbWeight: 0.0,
        GrossTrainWeight: null,
        LoadLength: null,
        DataVersionNumber: null,
        WheelBase: null,
        CarLength: 4667.0,
        Width: 2190.0,
        NumberOfAxles: 2,
        GrossVehicleWeight: null,
        GrossCombinedWeight: null,
      },
      General: {
        Engine: {
          Stroke: 85.0,
          PrimaryFuelFlag: "Y",
          ValvesPerCylinder: 4,
          Aspiration: "NATURALLY ASPIRATED",
          NumberOfCylinders: 8,
          CylinderArrangement: "VEE",
          ValveGear: "DOHC",
          Location: "FRONT",
          Description: "M62 EU3/4.6",
          Bore: 93.0,
          Make: "BMW",
        },
        PowerDelivery: "NORMAL",
        TypeApprovalCategory: "M1",
        DrivingAxle: "ALL - PERMANENT",
        DataVersionNumber: null,
        EuroStatus: "0",
      },
      Performance: {
        Torque: {
          FtLb: 354.2,
          Nm: 479.9,
          Rpm: 3700.0,
        },
        DataVersionNumber: null,
        Power: {
          Bhp: 342.0,
          Rpm: 5700.0,
          Kw: 255.0,
        },
        MaxSpeed: {
          Kph: 240.0,
          Mph: 149.0,
        },
        Co2: 356.0,
        Acceleration: {
          Mph: null,
          Kph: null,
        },
      },
      Consumption: {
        ExtraUrban: {
          Lkm: 11.4,
          Mpg: 24.8,
        },
        UrbanCold: {
          Lkm: 20.9,
          Mpg: 13.5,
        },
        Combined: {
          Lkm: 14.9,
          Mpg: 19.0,
        },
      },
    },
    ClassificationDetails: {
      Smmt: {
        Make: "BMW",
        Mvris: {
          ModelCode: "ASG",
          MakeCode: "M0",
        },
        Trim: "IS",
        Range: "X5",
      },
      Dvla: {
        ModelCode: "666",
        Model: "X5 IS AUTO",
        MakeCode: "M0",
        Make: "BMW",
      },
    },
    VehicleStatus: {
      MotVed: {
        VedRate: {
          FirstYear: {
            SixMonth: null,
            TwelveMonth: null,
          },
          PremiumVehicle: {
            YearTwoToSix: {
              TwelveMonth: null,
              SixMonth: null,
            },
          },
          Standard: {
            SixMonth: 162.25,
            TwelveMonth: 295.0,
          },
        },
        VedCo2Emissions: 356.0,
        MotDue: null,
        VedBand: "K",
        VedCo2Band: "M",
        TaxDue: new Date(),
        Message: null,
        VehicleStatus: null,
      },
    },
    VehicleHistory: {
      V5CCertificateCount: 0,
      PlateChangeCount: 7,
      NumberOfPreviousKeepers: 5,
      V5CCertificateList: null,
      KeeperChangesCount: 5,
      VicCount: 0,
      ColourChangeCount: 0,
      ColourChangeList: null,
      KeeperChangesList: [
        {
          DateOfTransaction: "2010-12-09T00:00:00",
          NumberOfPreviousKeepers: 5,
          DateOfLastKeeperChange: "2010-11-19T00:00:00",
        },
        {
          DateOfTransaction: "2009-09-18T00:00:00",
          NumberOfPreviousKeepers: 4,
          DateOfLastKeeperChange: "2009-08-28T00:00:00",
        },
        {
          DateOfTransaction: "2007-12-06T00:00:00",
          NumberOfPreviousKeepers: 3,
          DateOfLastKeeperChange: "2007-10-21T00:00:00",
        },
        {
          DateOfTransaction: "2007-07-06T00:00:00",
          NumberOfPreviousKeepers: 2,
          DateOfLastKeeperChange: "2007-06-20T00:00:00",
        },
        {
          DateOfTransaction: "2006-03-09T00:00:00",
          NumberOfPreviousKeepers: 1,
          DateOfLastKeeperChange: "2006-02-17T00:00:00",
        },
      ],
      PlateChangeList: [
        {
          CurrentVRM: "MYVRM",
          TransferType: "DataMove",
          DateOfReceipt: "2009-08-17T00:00:00",
          PreviousVRM: "RIW19",
          DateOfTransaction: "2009-08-17T00:00:00",
        },
        {
          CurrentVRM: "RIW19",
          TransferType: "DataMove",
          DateOfReceipt: "2009-01-28T00:00:00",
          PreviousVRM: "MYVRM",
          DateOfTransaction: "2009-01-28T00:00:00",
        },
        {
          CurrentVRM: "MYVRM",
          TransferType: "DataMove",
          DateOfReceipt: "2008-06-15T00:00:00",
          PreviousVRM: "RIW20",
          DateOfTransaction: "2008-06-15T00:00:00",
        },
        {
          CurrentVRM: "RIW20",
          TransferType: "DataMove",
          DateOfReceipt: "2007-11-28T00:00:00",
          PreviousVRM: "MYVRM",
          DateOfTransaction: "2007-11-28T00:00:00",
        },
        {
          CurrentVRM: "MYVRM",
          TransferType: "DataMove",
          DateOfReceipt: "2007-11-19T00:00:00",
          PreviousVRM: "B2ERW",
          DateOfTransaction: "2007-11-19T00:00:00",
        },
        {
          CurrentVRM: "B2ERW",
          TransferType: "DataMove",
          DateOfReceipt: "2007-06-19T00:00:00",
          PreviousVRM: "MYVRM",
          DateOfTransaction: "2007-06-19T00:00:00",
        },
        {
          CurrentVRM: "MYVRM",
          TransferType: "DataMove",
          DateOfReceipt: "2005-09-12T00:00:00",
          PreviousVRM: "CJL941",
          DateOfTransaction: "2005-09-12T00:00:00",
        },
      ],
      VicList: null,
    },
    VehicleRegistration: {
      DateOfLastUpdate: "2003-08-26T00:00:00",
      Colour: "SILVER",
      AbiBrokerNetCode: null,
      VehicleClass: "Car",
      EngineNumber: "52582984",
      EngineCapacity: "4619",
      TransmissionCode: "A",
      DtpMakeCode: "M0",
      Exported: false,
      YearOfManufacture: "2003",
      WheelPlan: null,
      DateExported: null,
      Scrapped: false,
      Transmission: "AUTO 5 GEARS",
      DateFirstRegisteredUk: "2003-06-23T00:00:00",
      Model: "X5 IS AUTO",
      GearCount: 5,
      ImportNonEu: false,
      DtpModelCode: "666",
      PreviousVrmGb: null,
      GrossWeight: 0.0,
      DoorPlanLiteral: "ESTATE",
      MvrisModelCode: "ASG",
      Vin: "FULL VIN available upon vetting",
      Vrm: "MYVRM",
      DateFirstRegistered: "2003-06-23T00:00:00",
      DateScrapped: null,
      DoorPlan: "06",
      VinLast5: "76270",
      VehicleUsedBeforeFirstRegistration: false,
      MaxPermissibleMass: 0.0,
      Make: "BMW",
      MakeModel: "BMW X5 IS AUTO",
      TransmissionType: "Automatic",
      SeatingCapacity: null,
      FuelType: "PETROL",
      Co2Emissions: 356.0,
      Imported: false,
      MvrisMakeCode: "M0",
      PreviousVrmNi: null,
      VinConfirmationFlag: null,
    },
    SmmtDetails: {
      Range: "X5",
      FuelType: "PETROL",
      EngineCapacity: "4619",
      MarketSectorCode: "AB",
      CountryOfOrigin: "USA",
      ModelCode: "666",
      ModelVariant: "IS",
      DataVersionNumber: null,
      NumberOfGears: 5,
      NominalEngineCapacity: 4.6,
      MarqueCode: "M0",
      Transmission: "AUTOMATIC",
      BodyStyle: "ESTATE",
      VisibilityDate: "01/10/2001",
      SysSetupDate: "01/10/2001",
      Marque: "BMW",
      CabType: "NA",
      TerminateDate: null,
      Series: "E53",
      NumberOfDoors: 5,
      DriveType: "4X4",
    },
    MotHistory: {
      RecordCount: 19,
      RecordList: [
        {
          TestDate: "12/04/2016",
          ExpiryDate: "11/04/2017",
          TestResult: "Pass",
          OdometerReading: 117459,
          TestNumber: "4346 8567 9943",
          AdvisoryNoticeList: [],
          FailureReasonList: [],
        },
        {
          TestDate: "11/04/2016",
          ExpiryDate: null,
          TestResult: "Fail",
          OdometerReading: 117458,
          TestNumber: "9268 7459 7737",
          AdvisoryNoticeList: [],
          FailureReasonList: [
            "Nearside Front constant velocity joint gaiter deteriorated to the extent that it no longer prevents the ingress of dirt etc (2.5.C.1a)",
            "Nearside Windscreen wiper does not clear the windscreen effectively (8.2.2)",
            "Offside Windscreen wiper does not clear the windscreen effectively (8.2.2)",
          ],
        },
        {
          TestDate: "25/03/2015",
          ExpiryDate: "24/03/2016",
          TestResult: "Pass",
          OdometerReading: 113225,
          TestNumber: "7793 0448 5043",
          AdvisoryNoticeList: [],
          FailureReasonList: [],
        },
        {
          TestDate: "20/03/2015",
          ExpiryDate: null,
          TestResult: "Fail",
          OdometerReading: 113220,
          TestNumber: "4269 9967 5052",
          AdvisoryNoticeList: [],
          FailureReasonList: [
            "Nearside Rear Tyre tread depth below requirements of 1.6mm (4.1.E.1)",
            "Offside Rear Tyre tread depth below requirements of 1.6mm (4.1.E.1)",
          ],
        },
        {
          TestDate: "07/03/2014",
          ExpiryDate: "06/03/2015",
          TestResult: "Pass",
          OdometerReading: 108752,
          TestNumber: "5361 6636 4062",
          AdvisoryNoticeList: [
            "Oil leak",
            "front tyres have cuts in side walls",
          ],
          FailureReasonList: [],
        },
        {
          TestDate: "07/03/2014",
          ExpiryDate: null,
          TestResult: "Fail",
          OdometerReading: 108752,
          TestNumber: "6792 2676 4038",
          AdvisoryNoticeList: [
            "Oil leak",
            "front tyres have cuts in side walls",
          ],
          FailureReasonList: [
            "Nearside Rear Rear position lamp(s) not working (1.1.A.3b)",
            "Offside Rear Rear position lamp(s) not working (1.1.A.3b)",
            "Offside Stop lamp not working (1.2.1b)",
            "Nearside Front suspension has excessive play in a lower suspension ball joint (2.5.B.1a)",
          ],
        },
        {
          TestDate: "15/11/2012",
          ExpiryDate: "02/12/2013",
          TestResult: "Pass",
          OdometerReading: 106013,
          TestNumber: "6864 2012 2373",
          AdvisoryNoticeList: [
            "n/s/r upper sidelight inoperative",
            "Handbrake ratchet worn",
          ],
          FailureReasonList: [],
        },
        {
          TestDate: "03/12/2011",
          ExpiryDate: "02/12/2012",
          TestResult: "Pass",
          OdometerReading: 103591,
          TestNumber: "3752 2773 1359",
          AdvisoryNoticeList: ["tyre pressure monitor system defective"],
          FailureReasonList: [],
        },
        {
          TestDate: "02/12/2011",
          ExpiryDate: null,
          TestResult: "Fail",
          OdometerReading: 103591,
          TestNumber: "8692 6683 1353",
          AdvisoryNoticeList: ["tyre pressure monitor system defective"],
          FailureReasonList: [
            "Offside Front Tyre has a cut in excess of the requirements deep enough to reach the ply or cords (4.1.D.1a)",
          ],
        },
        {
          TestDate: "14/07/2010",
          ExpiryDate: "14/07/2011",
          TestResult: "Pass",
          OdometerReading: 100267,
          TestNumber: "9137 2519 0126",
          AdvisoryNoticeList: [
            "Nearside Rear Brake pad(s) wearing thin (3.5.1g)",
            "Offside Rear Brake pad(s) wearing thin (3.5.1g)",
            "expansion tank water bottle cap missing",
          ],
          FailureReasonList: [],
        },
        {
          TestDate: "13/07/2010",
          ExpiryDate: null,
          TestResult: "Fail",
          OdometerReading: 100267,
          TestNumber: "2649 4489 0451",
          AdvisoryNoticeList: [
            "Nearside Rear Brake pad(s) wearing thin (3.5.1g)",
            "Offside Rear Brake pad(s) wearing thin (3.5.1g)",
            "expansion tank water bottle cap missing",
          ],
          FailureReasonList: [
            "Offside Rear Stop lamp not working (1.2.1b)",
            "Offside Rear All position lamps not working (1.1.A.3b)",
          ],
        },
        {
          TestDate: "15/07/2009",
          ExpiryDate: "14/07/2010",
          TestResult: "Pass",
          OdometerReading: 88259,
          TestNumber: "5648 0619 9154",
          AdvisoryNoticeList: [],
          FailureReasonList: [],
        },
        {
          TestDate: "14/07/2009",
          ExpiryDate: null,
          TestResult: "Fail",
          OdometerReading: 88257,
          TestNumber: "2846 8599 9468",
          AdvisoryNoticeList: [],
          FailureReasonList: [
            "Offside Outer Front constant velocity joint gaiter split (2.5.C.1a)",
          ],
        },
        {
          TestDate: "17/06/2008",
          ExpiryDate: "18/06/2009",
          TestResult: "Pass",
          OdometerReading: 85974,
          TestNumber: "3339 0966 8155",
          AdvisoryNoticeList: [],
          FailureReasonList: [],
        },
        {
          TestDate: "09/06/2008",
          ExpiryDate: null,
          TestResult: "Fail",
          OdometerReading: 85964,
          TestNumber: "2120 3196 8150",
          AdvisoryNoticeList: [],
          FailureReasonList: [
            "Nearside Outer Front constant velocity joint gaiter split (2.5.C.1a)",
          ],
        },
        {
          TestDate: "19/06/2007",
          ExpiryDate: "18/06/2008",
          TestResult: "Pass",
          OdometerReading: 82114,
          TestNumber: "5305 7067 7178",
          AdvisoryNoticeList: [
            "Nearside Inner Rear Tyre worn close to the legal limit (4.1.E.1)",
            "Nearside Rear Upper Suspension arm has slight play in a ball joint (2.4.G.2)",
            "Offside Rear Upper Suspension arm has slight play in a ball joint (2.4.G.2)",
          ],
          FailureReasonList: [],
        },
        {
          TestDate: "26/01/2007",
          ExpiryDate: "13/02/2008",
          TestResult: "Pass",
          OdometerReading: 76889,
          TestNumber: "2600 6612 7064",
          AdvisoryNoticeList: [],
          FailureReasonList: [],
        },
        {
          TestDate: "18/01/2007",
          ExpiryDate: null,
          TestResult: "Fail",
          OdometerReading: 76389,
          TestNumber: "7532 3831 7096",
          AdvisoryNoticeList: [],
          FailureReasonList: [
            "Offside Front Windscreen has damage to an area in excess of a 10mm circle within zone 'A' (8.3.1a)",
            "Centre Front Windscreen has damage to the swept area in excess of a 40mm circle outside zone 'A' (8.3.1d)",
            "Nearside Front Windscreen washer provides insufficient washer liquid (8.2.3)",
            "Offside Front Windscreen washer provides insufficient washer liquid (8.2.3)",
          ],
        },
        {
          TestDate: "14/02/2006",
          ExpiryDate: "13/02/2007",
          TestResult: "Pass",
          OdometerReading: 59115,
          TestNumber: "3525 8524 6059",
          AdvisoryNoticeList: [],
          FailureReasonList: [],
        },
      ],
    },
  },
};

sampleCheckData = {
  VehicleCheckData: {
    LicensePlate: "AB23CDE",
    Model: "Tesla Model S Plaid",
    Colour: "Black",
    Year: 2023,
  },
};

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/api/v1/vehicledata/initial", async (req, res) => {
  var config = {
    method: "get",
    url: "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    headers: {
      "x-api-key": "cMQncH4Szk8qpKoPQOlTQ5Cu9paQSp3KuNIcxzt0",
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      registrationNumber: req.body.licensePlate.toString(),
    }),
  };

  // axios(config)
  // 	.then(function(response) {
  // 		res.send(response.data);
  // 	})
  // 	.catch(function(error) {
  // 		console.log(error);
  // 	});

  res.send(sampleInitialData);
  console.log("vehicledata/initial endpoint hit");
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
      registrationNumber: req.body.licensePlate.toString(),
    }),
  };

  // axios(config)
  // 	.then(function(response) {
  // 		res.send(response.data);
  // 	})
  // 	.catch(function(error) {
  // 		console.log(error);
  // 	});

  res.send(sampleBasicData);
  console.log("vehicledata/basic endpoint hit");
});

app.post("/api/v1/vehicledata/full", async (req, res) => {
  console.log(req.body);
  var config = {
    method: "post",
    url: "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    headers: {
      "x-api-key": "cMQncH4Szk8qpKoPQOlTQ5Cu9paQSp3KuNIcxzt0",
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      registrationNumber: req.body.licensePlate.toString(),
    }),
  };

  // axios(config)
  // 	.then(function(response) {
  // 		res.send(response.data);
  // 	})
  // 	.catch(function(error) {
  // 		console.log(error);
  // 	});

  res.send(sampleFullData);
  console.log("vehicledata/full endpoint hit");
});

app.get("/api/v1/vehicledata/check/:licensePlate", async (req, res) => {
  var config = {
    method: "get",
    url: "https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles",
    headers: {
      "x-api-key": "cMQncH4Szk8qpKoPQOlTQ5Cu9paQSp3KuNIcxzt0",
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      registrationNumber: req.params.licensePlate.toString(),
    }),
  };

  // axios(config)
  // 	.then(function(response) {
  // 		res.send(response.data);
  // 	})
  // 	.catch(function(error) {
  // 		console.log(error);
  // 	});

  res.send(sampleCheckData);
  console.log("vehicledata/check endpoint hit");
});

app.get("/api/v1/chatgpt", async (req, res) => {});

app.post("/api/v1/create-checkout-session", async (req, res) => {
  // const session = await stripe.checkout.sessions.create({
  //   line_items: [
  //     {
  //       // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
  //       price: "{{PRICE_ID}}",
  //       quantity: 1,
  //     },
  //   ],
  //   mode: "payment",
  //   success_url: `${YOUR_DOMAIN}?success=true`,
  //   cancel_url: `${YOUR_DOMAIN}?canceled=true`,
  //   automatic_tax: { enabled: true },
  // });

  // res.redirect(303, session.url);
  res.send("Hello");
});

app.get("/", (req, res) => {
  res.send("Hello");
});

const port = 4242;
app.listen(port, () => console.log(`Listening on port ${port}...`));
