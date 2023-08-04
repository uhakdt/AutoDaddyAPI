function dataExtract(dataMain, vehicleFreeData) {
  let combinedResults =
    extractVehicleInfo(
      dataMain.VehicleAndMotHistory?.VehicleRegistration,
      dataMain.VehicleAndMotHistory?.TechnicalDetails,
      dataMain.VehicleAndMotHistory?.VehicleHistory
    ) +
    extractMOTHistory(dataMain.VehicleAndMotHistory?.MotHistory?.RecordList) +
    extractVehicleTAX(
      dataMain.VehicleAndMotHistory?.VehicleRegistration,
      vehicleFreeData
    ) +
    extractVehicleMileage(dataMain.VdiCheckFull?.MileageRecordList) +
    extractPlateChanges(
      dataMain.VehicleAndMotHistory?.VehicleHistory?.PlateChangeList
    ) +
    extractOutstandingFinances(dataMain.VdiCheckFull.FinanceRecordList) +
    extractImportantChecks(
      dataMain.VehicleAndMotHistory.VehicleRegistration,
      dataMain.VehicleAndMotHistory.VehicleHistory.V5CCertificateList,
      dataMain.VehicleAndMotHistory.VehicleHistory.V5CCertificateCount
    ) +
    extractStolenInfo(dataMain.VdiCheckFull) +
    extractImportExportInfo(dataMain.VehicleAndMotHistory.VehicleRegistration) +
    extractWriteOffInfo(dataMain.VdiCheckFull) +
    extractVICInfo(dataMain.VehicleAndMotHistory.VehicleHistory);

  return combinedResults;
}

function extractVehicleInfo(
  vehicleRegistration,
  technicalDetails,
  vehicleHistory
) {
  let vehicleInfoResult = "\nTopic: Main Details:\n";

  let mainDetails = {
    Model: vehicleRegistration.MakeModel || "N/A",
    "Fuel Type": vehicleRegistration.FuelType || "N/A",
    Engine: technicalDetails.General?.Engine || "N/A",
    Gearbox: vehicleRegistration.Transmission || "N/A",
    "Top Speed": technicalDetails.Performance?.MaxSpeed?.Mph || "N/A",
  };

  let keeperDetails = {
    "Date Of Transaction":
      vehicleHistory.KeeperChangesList?.[0]?.DateOfTransaction || "N/A",
    "Date Of Last Keeper Change":
      vehicleHistory.KeeperChangesList?.[0]?.DateOfLastKeeperChange || "N/A",
    "Number Of Previous Keepers":
      vehicleHistory.KeeperChangesList?.[0]?.NumberOfPreviousKeepers || "N/A",
  };

  let energyAndConsumption = {
    Power: technicalDetails.Performance?.Power?.Bhp || "N/A",
    Torque: technicalDetails.Performance?.Torque?.FtLb || "N/A",
    Cylinders: technicalDetails.General?.Engine?.NumberOfCylinders || "N/A",
    Urban: technicalDetails.Consumption?.UrbanCold?.Mpg || "N/A",
    "Extra Urban": technicalDetails.Consumption?.ExtraUrban?.Mpg || "N/A",
    Combined: technicalDetails.Consumption?.Combined?.Mpg || "N/A",
    "CO2 Emissions": technicalDetails.Performance?.Co2 || "N/A",
  };

  let mainDetailsWeights = {
    Model: 1,
    "Fuel Type": mainDetails["Fuel Type"] === "PETROL" ? 0.5 : 1,
    Engine: 0.6,
    Gearbox: 1,
    "Top Speed": 0.2,
  };

  let energyAndConsumptionWeights = {
    Power:
      energyAndConsumption["Power"] !== "N/A" &&
      energyAndConsumption["Power"] > 150
        ? 0.5
        : 0.25,
    Torque:
      energyAndConsumption["Torque"] !== "N/A" &&
      energyAndConsumption["Torque"] > 200
        ? 0.5
        : 0.25,
    Cylinders:
      mainDetails["Engine"] !== "N/A" &&
      mainDetails["Engine"]["NumberOfCylinders"] === 4
        ? 1
        : 0.5,
    Urban:
      energyAndConsumption["Urban"] !== "N/A" &&
      energyAndConsumption["Urban"] > 50
        ? 0.5
        : 0.25,
    "Extra Urban":
      energyAndConsumption["Extra Urban"] !== "N/A" &&
      energyAndConsumption["Extra Urban"] > 60
        ? 0.5
        : 0.25,
    Combined:
      energyAndConsumption["Combined"] !== "N/A" &&
      energyAndConsumption["Combined"] > 60
        ? 1
        : 0.5,
    "CO2 Emissions": 1,
  };

  let co2EmissionsRating = "N/A";
  if (energyAndConsumption["CO2 Emissions"] !== "N/A") {
    let co2Emissions = energyAndConsumption["CO2 Emissions"];
    if (co2Emissions < 100) {
      co2EmissionsRating = "very good";
    } else if (co2Emissions < 120) {
      co2EmissionsRating = "good";
    } else if (co2Emissions < 140) {
      co2EmissionsRating = "neutral";
    } else if (co2Emissions < 160) {
      co2EmissionsRating = "bad";
    } else {
      co2EmissionsRating = "very bad";
    }
  }

  for (let key in mainDetails) {
    vehicleInfoResult += `${key}: ${mainDetails[key]}, Weight: ${
      mainDetailsWeights[key] || "N/A"
    }\n`;
  }

  vehicleInfoResult += "Keeper's Details:\n";
  for (let key in keeperDetails) {
    vehicleInfoResult += `${key}: ${keeperDetails[key]}\n`;
  }

  vehicleInfoResult += "\n Sub Topic: Energy & Consumption:\n";
  for (let key in energyAndConsumption) {
    if (key === "CO2 Emissions") {
      vehicleInfoResult += `${key}: ${energyAndConsumption[key]}, Weight: ${
        energyAndConsumptionWeights[key] || "N/A"
      }, Positive/NegativeRating: ${co2EmissionsRating}\n`;
    } else {
      vehicleInfoResult += `${key}: ${energyAndConsumption[key]}, Weight: ${
        energyAndConsumptionWeights[key] || "N/A"
      }\n`;
    }
  }

  return vehicleInfoResult;
}

function extractMOTHistory(motHistory) {
  let motHistoryResult = "\n Sub Topic: MOT History:\n";

  function getRating(value, thresholds, ratings) {
    if (value === null || value === "N/A") {
      return "N/A";
    }
    for (let i = 0; i < thresholds.length; i++) {
      if (value <= thresholds[i]) {
        return ratings[i];
      }
    }
    return ratings[ratings.length - 1];
  }

  // Initialize variables
  let [
    totalTests,
    passCount,
    failCount,
    adviceItems,
    totalItemsFailed,
    dangerousFailures,
    retests,
  ] = Array(8).fill(0);
  let recencyOfFailure = "N/A";
  let testDetails = [];

  for (let record of motHistory) {
    // Count pass and fail results
    let testResult = record["TestResult"] || "N/A";
    passCount += testResult === "Pass";
    failCount += testResult === "Fail";

    if (testResult === "Fail") {
      recencyOfFailure = record["DaysSinceLastTest"] || "N/A";
    }

    // Count advice items, failures, dangerous failures, and retests
    adviceItems += record["AdvisoryNoticeCount"] || 0;
    totalItemsFailed += (record["FailureReasonList"] || []).length;
    dangerousFailures += record["DangerousFailureCount"] || 0;
    retests += record["IsRetest"] || false;

    // Append test details for later reporting
    testDetails.push({
      ExpiryDate: record["ExpiryDate"] || "N/A",
      TestDate: record["TestDate"] || "N/A",
      TestNumber: record["TestNumber"] || "N/A",
      TestResult: record["TestResult"] || "N/A",
    });
  }

  // Calculate pass rate, or set to 0 if no tests
  totalTests = motHistory.length;
  let passRate = totalTests != 0 ? (passCount / totalTests) * 100 : 0;

  // Generate ratings based on individual metric thresholds
  let thresholds = [0, 2, 4, 6];
  let ratings = ["Very Good", "Good", "Neutral", "Bad", "Very Bad"];
  let passRateRating = getRating(passRate, [95, 90, 70, 60], ratings);
  let failCountRating = getRating(failCount, thresholds, ratings);
  let adviceItemsRating = getRating(adviceItems, thresholds, ratings);
  let totalItemsFailedRating = getRating(totalItemsFailed, thresholds, ratings);
  let dangerousFailuresRating = getRating(
    dangerousFailures,
    thresholds,
    ratings
  );
  let retestsRating = getRating(retests, thresholds, ratings);
  let recencyOfFailureRating = getRating(
    recencyOfFailure,
    [365, 200, 100, 50],
    ratings
  );

  // Append the results to motHistoryResult string
  motHistoryResult += "MOT Metrics:\n";
  motHistoryResult += `Pass Rate: ${passRate}%, Rating: ${passRateRating}\n`;
  motHistoryResult += `Failed Tests: ${failCount}, Rating: ${failCountRating}\n`;
  motHistoryResult += `Total Advice Items: ${adviceItems}, Rating: ${adviceItemsRating}\n`;
  motHistoryResult += `Total Items Failed: ${totalItemsFailed}, Rating: ${totalItemsFailedRating}\n`;
  motHistoryResult += `Dangerous Failures: ${dangerousFailures}, Rating: ${dangerousFailuresRating}\n`;
  motHistoryResult += `Retests: ${retests}, Rating: ${retestsRating}\n`;
  motHistoryResult += `Recency of Failure: ${recencyOfFailure}, Rating: ${recencyOfFailureRating}\n`;

  for (let test of testDetails) {
    motHistoryResult += JSON.stringify(test) + "\n";
  }

  return motHistoryResult;
}

function extractVehicleTAX(vehicleRegistration, vehicleFreeData) {
  let vehicleTaxResult = "\nTopic: Tax Details:\n";

  // Calculate the days left for tax due date
  let taxDueDateStr = vehicleFreeData["TaxDueDate"] || "1900-01-01";
  let taxDueDate = new Date(taxDueDateStr);
  let currentDate = new Date();
  let timeDiff = taxDueDate - currentDate;
  let daysLeft =
    timeDiff > 0 ? Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) : "N/A";

  let daysLeftRating = "N/A";
  let daysLeftWeight = "N/A";
  if (daysLeft !== "N/A") {
    if (daysLeft > 60) {
      daysLeftRating = "Very Good";
      daysLeftWeight = 1;
    } else if (daysLeft > 30) {
      daysLeftRating = "Good";
      daysLeftWeight = 0.5;
    } else if (daysLeft > 15) {
      daysLeftRating = "Neutral";
      daysLeftWeight = 0.5;
    } else if (daysLeft > 0) {
      daysLeftRating = "Bad";
      daysLeftWeight = 0.5;
    } else {
      daysLeftRating = "Very Bad";
      daysLeftWeight = 1;
    }
  }

  let taxStatusRating = "N/A";
  if ("TaxStatus" in vehicleFreeData) {
    taxStatusRating =
      vehicleFreeData["TaxStatus"] === "Taxed" ? "Very Good" : "Bad";
  }

  // Create a dictionary to hold the required tax details
  let taxInfo = {
    "Tax Status": vehicleFreeData["TaxStatus"] || "N/A",
    "Days Left": daysLeft,
    "Vehicle Class": vehicleRegistration["VehicleClass"] || "N/A",
  };

  // Default weights if none provided
  let taxInfoWeights = {
    "Tax Status": 1,
    "Days Left": daysLeftWeight,
    "Vehicle Class": 0.5,
  };

  for (let [key, value] of Object.entries(taxInfo)) {
    if (key === "Days Left") {
      vehicleTaxResult += `${key}: ${value}, Weight: ${taxInfoWeights[key]}, Positive/NegativeRating: ${daysLeftRating}\n`;
    } else if (key === "Tax Status") {
      vehicleTaxResult += `${key}: ${value}, Weight: ${taxInfoWeights[key]}, Positive/NegativeRating: ${taxStatusRating}\n`;
    } else {
      vehicleTaxResult += `${key}: ${value}, Weight: ${taxInfoWeights[key]}\n`;
    }
  }

  return vehicleTaxResult;
}

function extractVehicleMileage(mileageRecords) {
  let mileageResult = "\nTopic: Mileage\n";

  // Ensure there are records to extract
  if (mileageRecords.length === 0) {
    return "No mileage records available.";
  }

  // Sort mileage records in ascending order of date of information
  mileageRecords.sort(
    (a, b) =>
      new Date(a["DateOfInformation"] || "01/01/1900") -
      new Date(b["DateOfInformation"] || "01/01/1900")
  );

  // Initialize variables
  let firstMileage, lastMileage, totalRecords;
  let firstRecordDate, lastRecordDate;
  let anomaly = false;

  // Iterate over mileage records
  for (let record of mileageRecords) {
    let recordDate = record["DateOfInformation"] || "01/01/1900";
    let mileage = record["Mileage"];
    if (!mileage) {
      continue;
    }

    // Initialize first record date and first mileage
    if (!firstRecordDate) {
      firstRecordDate = recordDate;
      firstMileage = mileage;
    }

    // Update last record date and last mileage
    lastRecordDate = recordDate;
    lastMileage = mileage;

    // Check for mileage anomaly
    if (lastMileage < firstMileage) {
      anomaly = true;
    }

    totalRecords = (totalRecords || 0) + 1;
  }

  // Ensure there were records with mileage
  if (!firstMileage || !lastMileage || !totalRecords) {
    return "No valid mileage records available.";
  }

  // Calculate average mileage per year
  let firstYear = parseInt(firstRecordDate.split("/")[2]);
  let lastYear = parseInt(lastRecordDate.split("/")[2]);
  let years = lastYear - firstYear;
  let totalMileage = lastMileage - firstMileage;
  let averageMileage = years !== 0 ? totalMileage / years : 0;

  // Calculate rating for average mileage based on the age of the vehicle
  let averageMileageRating;
  if (averageMileage < 4000) {
    averageMileageRating = "Very Good";
  } else if (averageMileage < 8000) {
    averageMileageRating = "Good";
  } else if (averageMileage < 11000) {
    averageMileageRating = "Neutral";
  } else if (averageMileage < 170000) {
    averageMileageRating = "Bad";
  } else {
    averageMileageRating = "Very Bad";
  }

  // Calculate rating for total_mileage
  let totalMileageRating;
  if (totalMileage < 10000) {
    totalMileageRating = "Very Good";
  } else if (totalMileage / years < 30000) {
    totalMileageRating = "Good";
  } else if (totalMileage / years < 70000) {
    totalMileageRating = "Neutral";
  } else if (totalMileage / years < 100000) {
    totalMileageRating = "Bad";
  } else {
    totalMileageRating = "Very Bad";
  }

  // Calculate rating for number of registrations considering the age of the vehicle
  let registrationsPerYear = years !== 0 ? totalRecords / years : totalRecords;
  let totalRecordsRating;
  if (registrationsPerYear <= 0.25) {
    totalRecordsRating = "Very Good";
  } else if (registrationsPerYear <= 0.5) {
    totalRecordsRating = "Good";
  } else if (registrationsPerYear <= 0.75) {
    totalRecordsRating = "Neutral";
  } else if (registrationsPerYear <= 1) {
    totalRecordsRating = "Bad";
  } else {
    totalRecordsRating = "Very Bad";
  }

  // Calculate rating for anomaly
  let anomalyRating = anomaly ? "Bad" : "Neutral";
  let anomalyWeight = anomaly ? 1 : 0.1;

  mileageResult += `Odometer: ${lastMileage}, Weight: 1, Positive/NegativeRating: ${totalMileageRating}\n`;
  mileageResult += `No. of mileage registrations: ${totalRecords}, Weight: 1, Positive/NegativeRating: ${totalRecordsRating}\n`;
  mileageResult += `Anomaly: ${anomaly}, Weight: ${anomalyWeight}, Positive/NegativeRating: ${anomalyRating}\n`;
  mileageResult += `First Registration: ${firstRecordDate}, Weight: 0.2\n`;
  mileageResult += `Last Registration: ${lastRecordDate}, Weight: 0.2\n`;
  mileageResult += `Average Mileage: ${averageMileage}, Weight: 1, Positive/NegativeRating: ${averageMileageRating}\n`;

  return mileageResult;
}

function extractPlateChanges(plateRecords) {
  let plateResults = "\nTopic: Plate Changes\n";

  if (plateRecords.length === 0) {
    return "No plate change records found.";
  }

  // Sort plate records in descending order of date of change
  try {
    plateRecords.sort(
      (a, b) =>
        new Date(b["DateOfTransaction"] || 0) -
        new Date(a["DateOfTransaction"] || 0)
    );
  } catch (e) {
    return "Error in sorting plate records. Ensure all DateOfTransaction fields are in the correct format.";
  }

  // Iterate over plate records
  for (let record of plateRecords) {
    if (record["DateOfTransaction"] && record["PreviousVRM"]) {
      plateResults += `Date Changed: ${record["DateOfTransaction"]}, Weight: 0.5\n`;
      plateResults += `Previous Plate Number: ${record["PreviousVRM"]}, Weight: 0.5\n`;
    } else {
      plateResults += "Incomplete record found. Please check the data.\n";
    }
  }

  // Return the accumulated output
  return plateResults;
}

function extractOutstandingFinances(financeRecords) {
  let financesResults = "\nTopic: Outstanding Finances\n";

  if (financeRecords.length === 0) {
    return "No outstanding finance records found.";
  }

  // Define rating scales
  let agreementTypeScale = {
    Lease: "Very Good",
    Loan: "Good",
    Mortgage: "Neutral",
    "Personal contract purchase": "Bad",
    "HIRE PURCHASE": "Very Bad",
  };

  // Iterate over finance records
  for (let record of financeRecords) {
    if (record.AgreementDate && record.AgreementTerm && record.AgreementType) {
      let agreementDate = new Date(record.AgreementDate);
      let agreementTermDays = parseInt(record.AgreementTerm, 10) * 30; // assuming each month has 30 days
      let daysSinceAgreement =
        (new Date() - agreementDate) / (1000 * 60 * 60 * 24);

      let termRating =
        agreementTermDays > daysSinceAgreement ? "Very Bad" : "Very Good";
      let agreementTypeRating =
        agreementTypeScale[record.AgreementType] || "N/A";

      financesResults += `Agreement Date: ${record.AgreementDate}, Weight: 0.5\n`;
      financesResults += `Agreement Term: ${record.AgreementTerm} months, Validity: ${termRating}, Weight: 1\n`;
      financesResults += `Agreement Type: ${record.AgreementType}, Weight: 1, Positive/NegativeRating: ${agreementTypeRating}\n`;
      financesResults += `Finance Company: ${
        record.FinanceCompany || "N/A"
      }, Weight: 0.2\n`;
      financesResults += `Vehicle Description: ${
        record.VehicleDescription || "N/A"
      }, Weight: 0.2\n`;
    }
  }

  // Evaluate the number of records
  let numRecords = financeRecords.length;
  let recordsRating;
  if (numRecords === 0) {
    recordsRating = "Very Good";
  } else if (numRecords <= 1) {
    recordsRating = "Good";
  } else if (numRecords <= 2) {
    recordsRating = "Neutral";
  } else if (numRecords <= 3) {
    recordsRating = "Bad";
  } else {
    recordsRating = "Very Bad";
  }

  financesResults += `Number of Outstanding Finance Records: ${numRecords}, Weight: 1, Positive/NegativeRating: ${recordsRating}\n`;

  // Return the accumulated output
  return financesResults;
}

function extractImportantChecks(
  importantChecksRecords,
  v5cCertificateList,
  v5cCount
) {
  let importantChecksResults = "\nTopic: Important Checks\n";

  try {
    let vinLast5 = importantChecksRecords.VinLast5.slice(-5);
    let vinLast5Score = vinLast5.length === 5 ? "Good" : "Bad"; // Ideally, VIN should have last 5 digits
    importantChecksResults += `VIN Last 5 Digits: ${vinLast5}, Weight: 1, Positive/NegativeRating: ${vinLast5Score}\n`;

    let engineNumber = importantChecksRecords.EngineNumber;
    let engineNumberScore = engineNumber ? "Good" : "Bad"; // Ideally, there should be an engine number
    importantChecksResults += `Engine Number: ${engineNumber}, Weight: 1, Positive/NegativeRating: ${engineNumberScore}\n`;

    let v5cCountScore;
    if (v5cCount <= 2) {
      v5cCountScore = "Very Good";
    } else if (v5cCount <= 4) {
      v5cCountScore = "Good";
    } else if (v5cCount <= 6) {
      v5cCountScore = "Neutral";
    } else if (v5cCount <= 8) {
      v5cCountScore = "Bad";
    } else {
      v5cCountScore = "Very Bad";
    }
    importantChecksResults += `Number of v5c Certificates: ${v5cCount}, Weight: 0.5, Positive/NegativeRating: ${v5cCountScore}\n`;

    // Check if V5CCertificateList is not empty and contains a CertificateDate
    if (v5cCertificateList && v5cCertificateList[0].CertificateDate) {
      let certificateDate = v5cCertificateList[0].CertificateDate;
      let certificateDateScore = "Good"; // If date exists, it's always very good
      importantChecksResults += `V5C Date: ${certificateDate}, Weight: 1, Positive/NegativeRating: ${certificateDateScore}\n`;
    } else {
      importantChecksResults += "No V5C Date available\n";
    }
  } catch (e) {
    importantChecksResults += `The key ${e} does not exist in the dictionary\n`;
  }

  return importantChecksResults;
}

function extractStolenInfo(vdiCheckFull) {
  let stolenInfoResults = "\nTopic: Stolen\n";

  // Try to print the Stolen Status, Contact Number, Date, Police Force, Information Source
  if (vdiCheckFull.StolenStatus) {
    try {
      stolenInfoResults += `\n Sub Topic: Status: ${vdiCheckFull.StolenStatus}, Weight: 1, Positive/NegativeRating: Very Bad,\n`;
      stolenInfoResults += `\n Sub Topic: Contact Number: ${vdiCheckFull.StolenContactNumber}, Weight: 1\n`;
      stolenInfoResults += `\n Sub Topic: Date: ${vdiCheckFull.StolenDate}, Weight: 1\n`;
      stolenInfoResults += `\n Sub Topic: Police Force: ${vdiCheckFull.StolenPoliceForce}, Weight: 1\n`;
      stolenInfoResults += `\n Sub Topic: Information Source: ${vdiCheckFull.StolenInfoSource}, Weight: 1\n`;
    } catch (e) {
      stolenInfoResults += `The key ${e} does not exist in the dictionary\n`;
    }
  } else {
    stolenInfoResults +=
      "The vehicle is not reported as stolen. Weight: 0.5, Positive/NegativeRating: Good\n";
  }

  return stolenInfoResults;
}

function extractImportExportInfo(vehicleRegistration) {
  let exportResults = "\nTopic: Import / Export \n";

  let weights = {
    DateFirstRegistered: 1,
    Imported: 1,
    ImportDate: 0.5,
    ImportUsedBeforeUKRegistration: 0.5,
    ImportedFromOutsideEU: 0.5,
    Exported: 0.5,
    ExportDate: 0.5,
  };

  let result = [
    [
      "DateFirstRegistered",
      vehicleRegistration.DateFirstRegistered,
      weights["DateFirstRegistered"],
    ],
    [
      "Imported",
      vehicleRegistration.Imported ? "Yes" : "No",
      weights["Imported"],
    ],
    [
      "ImportDate",
      vehicleRegistration.Imported
        ? vehicleRegistration.DateFirstRegistered
        : null,
      weights["ImportDate"],
    ],
    [
      "ImportUsedBeforeUKRegistration",
      vehicleRegistration.VehicleUsedBeforeFirstRegistration ? "Yes" : "No",
      weights["ImportUsedBeforeUKRegistration"],
    ],
    [
      "ImportedFromOutsideEU",
      vehicleRegistration.ImportNonEu ? "Yes" : "No",
      weights["ImportedFromOutsideEU"],
    ],
    [
      "Exported",
      vehicleRegistration.Exported ? "Yes" : "No",
      weights["Exported"],
    ],
    [
      "ExportDate",
      vehicleRegistration.Exported ? vehicleRegistration.DateExported : null,
      weights["ExportDate"],
    ],
  ];

  for (let item of result) {
    exportResults += `${item[0]}: ${item[1]}, Weight: ${item[2]}\n`;
  }

  return exportResults;
}

function extractWriteOffInfo(vdiCheckFull) {
  let writeOffResults = "\nTopic: Write Off \n";

  let weights = {
    Date: 1,
    Category: 1,
    "Record Count": 1,
    RecordList: 1, // weight for WriteOffRecordList
  };

  let recordCount = vdiCheckFull.WriteOffRecordCount || 0;
  let recordCountScore = "Unknown";
  if (recordCount === 0) {
    recordCountScore = "Very Good";
  } else if (recordCount === 1) {
    recordCountScore = "Good";
  } else if (recordCount <= 3) {
    recordCountScore = "Neutral";
  } else if (recordCount <= 5) {
    recordCountScore = "Bad";
  } else {
    recordCountScore = "Very Bad";
  }

  let category = vdiCheckFull.WriteOffCategory || "N/A";
  let categoryScore = "Unknown";
  if (category === "A") {
    categoryScore = "Very Bad";
  } else if (category === "B") {
    categoryScore = "Very Bad";
  } else if (category === "S") {
    categoryScore = "Bad";
  } else {
    // category 'N'
    categoryScore = "Good";
  }

  let result = [
    ["Record Count", recordCount, recordCountScore, weights["Record Count"]],
    ["Category", category, categoryScore, weights["Category"]],
  ];

  for (let item of result) {
    writeOffResults += `${item[0]}: ${item[1]}, Weight: ${item[3]}, Positive/NegativeRating: ${item[2]}\n`;
  }

  let writeOffRecordList = vdiCheckFull.WriteOffRecordList || [];

  if (writeOffRecordList.length > 0) {
    for (let idx = 0; idx < writeOffRecordList.length; idx++) {
      let record = writeOffRecordList[idx];
      let miaftrEntryDate = record.MiaftrEntryDate || "N/A";
      let lossDate = record.LossDate || "N/A";
      let lossType = record.LossType || "N/A";
      let category = record.Category || "N/A";

      let categoryScore = "Unknown";
      if (category === "A") {
        categoryScore = "Very Bad";
      } else if (category === "B") {
        categoryScore = "Very Bad";
      } else if (category === "S") {
        categoryScore = "Bad";
      } else {
        // category 'N'
        categoryScore = "Good";
      }

      writeOffResults += `Write Off Record ${
        idx + 1
      }: MiaftrEntryDate: ${miaftrEntryDate}, LossDate: ${lossDate}, LossType: ${lossType}, Category: ${category}, Weight: ${
        weights["RecordList"]
      }, Category Score: ${categoryScore}\n`;
    }
  }

  return writeOffResults;
}

function extractVICInfo(vehicleHistory) {
  let vicResults = "\nTopic: VIC \n";

  let vicList = Array.isArray(vehicleHistory.VicList)
    ? vehicleHistory.VicList
    : null;

  let weights = {
    Date: 1,
    Result: 1,
  };

  if (!vicList) {
    vicResults +=
      "No VIC test detected. Weight: 0.5, Positive/NegativeRating: Very Good\n";
  } else {
    vicResults +=
      "VIC test detected. Weight: 1, Positive/NegativeRating: Bad\nVIC List:\n";
    for (let i = 0; i < vicList.length; i++) {
      let vic = vicList[i];
      vicResults += `VIC Entry ${i + 1}:\n`;
      for (let key in vic) {
        if (vic.hasOwnProperty(key)) {
          vicResults += `${key}: ${vic[key]}, Weight: ${weights[key] || 1}\n`; // assign weight 1 if not defined in weights dict
        }
      }
    }
  }

  return vicResults;
}

export { dataExtract };
