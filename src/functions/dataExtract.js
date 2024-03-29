function dataExtract(dataMain, vehicleFreeData, isUlezCompliant) {
  let combinedResults =
    extractVehicleInfo(
      dataMain.VehicleAndMotHistory?.VehicleRegistration,
      dataMain.VehicleAndMotHistory?.TechnicalDetails,
      dataMain.VehicleAndMotHistory?.VehicleHistory
    ) +
    extractULEZCompliance(isUlezCompliant) +
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
    extractVICInfo(dataMain.VehicleAndMotHistory.VehicleHistory) +
    extractSalvage(dataMain.Salvage) +
    extractTaxi(dataMain.Taxi);

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

  for (let key in mainDetails) {
    vehicleInfoResult += `${key}: ${mainDetails[key]}\n`;
  }

  vehicleInfoResult += "\nKeeper's Details:\n";
  for (let key in keeperDetails) {
    vehicleInfoResult += `${key}: ${keeperDetails[key]}\n`;
  }

  vehicleInfoResult += "\n Sub Topic: Energy & Consumption:\n";
  for (let key in energyAndConsumption) {
    vehicleInfoResult += `${key}: ${energyAndConsumption[key]}\n`;
  }

  return vehicleInfoResult;
}

function extractULEZCompliance(isUlezCompliant) {
  let ulezComplianceResult = "\nTopic: ULEZ Compliance:\n";
  if (isUlezCompliant) {
    ulezComplianceResult += "ULEZ Compliant\n";
  } else {
    ulezComplianceResult += "ULEZ Not Compliant\n";
  }
  return ulezComplianceResult;
}

function extractMOTHistory(motHistory) {
  let motHistoryResult = "\nSub Topic: MOT History:\n";

  // Initialize variables
  let [
    totalTests,
    passCount,
    failCount,
    adviceItems,
    totalItemsFailed,
    dangerousFailures,
    retests,
  ] = Array(7).fill(0);

  let recencyOfFailure = "N/A";
  let testDetails = [];
  let annotations = [];

  if (Array.isArray(motHistory)) {
    for (let record of motHistory) {
      // Count pass and fail results
      let testResult = record["TestResult"] || "N/A";
      if (testResult === "Pass") {
        passCount++;
      } else if (testResult === "Fail") {
        failCount++;
        recencyOfFailure = record["DaysSinceLastTest"] || "N/A";
      }

      // Count advice items, failures, dangerous failures, and retests
      adviceItems += record["AdvisoryNoticeCount"] || 0;
      totalItemsFailed += (record["FailureReasonList"] || []).length;
      dangerousFailures += record["DangerousFailureCount"] || 0;

      if (record["IsRetest"]) {
        retests++;
      }

      // Append test details for later reporting
      testDetails.push(
        `ExpiryDate: ${record["ExpiryDate"] || "N/A"}, TestDate: ${
          record["TestDate"] || "N/A"
        }, TestNumber: ${record["TestNumber"] || "N/A"}, TestResult: ${
          record["TestResult"] || "N/A"
        }`
      );

      // Handle annotations
      if (
        record["AnnotationDetailsList"] &&
        record["AnnotationDetailsList"].length > 0
      ) {
        record["AnnotationDetailsList"].forEach((annotation, index) => {
          annotations.push(
            `Advice ${index + 1}:\nType: ${annotation.Type}\nDetails: ${
              annotation.Text
            }\nDangerous: ${annotation.Dangerous}\n`
          );
        });
      }
    }

    // Calculate pass rate, or set to 0 if no tests
    totalTests = motHistory.length;
    let passRate =
      totalTests !== 0 ? ((passCount / totalTests) * 100).toFixed(2) : 0.0;

    // Append the results to motHistoryResult string
    motHistoryResult += "MOT Metrics:\n";
    motHistoryResult += `Pass Rate: ${passRate}%\n`;
    motHistoryResult += `Failed Tests: ${failCount}\n`;
    motHistoryResult += `Total Advice Items: ${adviceItems}\n`;
    motHistoryResult += `Total Items Failed: ${totalItemsFailed}\n`;
    motHistoryResult += `Dangerous Failures: ${dangerousFailures}\n`;
    motHistoryResult += `Retests: ${retests}\n`;
    motHistoryResult += `Recency of Failure: ${recencyOfFailure}\n\n`;

    motHistoryResult += "Individual Test Details:\n";
    for (let test of testDetails) {
      motHistoryResult += test + "\n";
    }

    if (annotations.length > 0) {
      motHistoryResult += "\nAnnotation Details:\n";
      for (let annotation of annotations) {
        motHistoryResult += annotation + "\n";
      }
    }
  } else {
    motHistoryResult += "No MOT history available.\n";
  }

  return motHistoryResult;
}

function extractVehicleTAX(vehicleRegistration, vehicleFreeData) {
  let vehicleTaxResult = "\nTopic: Tax Details:\n";

  // Calculate the days left for tax due date
  const taxDueDateStr = vehicleFreeData["TaxDueDate"] || "1900-01-01";
  const taxDueDate = new Date(taxDueDateStr);
  const currentDate = new Date();
  const daysLeft =
    taxDueDate > currentDate
      ? Math.ceil((taxDueDate - currentDate) / (1000 * 60 * 60 * 24))
      : "N/A";

  // Create a dictionary to hold the required tax details
  const taxInfo = {
    "Tax Status": vehicleFreeData["TaxStatus"] || "N/A",
    "Days Left": daysLeft,
    "Vehicle Class": vehicleRegistration["VehicleClass"] || "N/A",
  };

  // Append tax details to the result string
  for (const [key, value] of Object.entries(taxInfo)) {
    vehicleTaxResult += `${key}: ${value}\n`;
  }

  // Append additional message
  vehicleTaxResult += `\nThe tax or SORN isnt passed on when you sell a vehicle or transfer ownership to someone else. This includes giving it to a member of your family.\n`;

  return vehicleTaxResult;
}

function extractVehicleMileage(mileageRecords) {
  // Ensure there are records to extract
  if (
    mileageRecords === null ||
    mileageRecords === undefined ||
    mileageRecords.length === 0
  ) {
    return "No mileage records available.";
  }

  // Sort mileage records in ascending order of date of information
  const sortedMileageRecords = mileageRecords
    .slice()
    .sort((a, b) => {
      const dateA = new Date(
        a.DateOfInformation.split("/").reverse().join("-")
      );
      const dateB = new Date(
        b.DateOfInformation.split("/").reverse().join("-")
      );
      return dateB - dateA;
    })
    .reverse();

  const firstRecord = sortedMileageRecords[0];
  const lastRecord = sortedMileageRecords[sortedMileageRecords.length - 1];

  const lastMileage = parseInt(lastRecord.Mileage, 10);

  const firstYear = new Date(
    firstRecord.DateOfInformation.split("/").reverse().join("-")
  ).getFullYear();
  const lastYear = new Date(
    lastRecord.DateOfInformation.split("/").reverse().join("-")
  ).getFullYear();

  const years = lastYear - firstYear;
  const averageMileage = years !== 0 ? (lastMileage / years).toFixed(0) : "N/A";

  return `
  Topic: Mileage
  Total Mileage: ${lastMileage} miles
  Average Mileage: ${averageMileage} miles per year
  `;
}

function extractPlateChanges(plateRecords) {
  let plateResults = "\nTopic: Plate Changes\n";

  if (
    plateRecords === null ||
    plateRecords === undefined ||
    plateRecords.length === 0
  ) {
    return "No plate change records found.";
  }

  try {
    plateRecords.sort(
      (a, b) =>
        new Date(b["DateOfTransaction"] || 0) -
        new Date(a["DateOfTransaction"] || 0)
    );
  } catch (e) {
    return "Error in sorting plate records. Ensure all DateOfTransaction fields are in the correct format.";
  }

  for (let record of plateRecords) {
    if (record["DateOfTransaction"] && record["PreviousVRM"]) {
      plateResults += `Date Changed: ${record["DateOfTransaction"]}\n`;
      plateResults += `Previous Plate Number: ${record["PreviousVRM"]}\n`;
    } else {
      plateResults += "Incomplete record found. Please check the data.\n";
    }
  }

  return plateResults;
}

function extractOutstandingFinances(financeRecords) {
  let financesResults = "\nTopic: Outstanding Finances\n";

  if (
    financeRecords === null ||
    financeRecords === undefined ||
    financeRecords.length === 0
  ) {
    return "No outstanding finance records found.";
  }

  financesResults += `Number of Outstanding Finance Records: ${financeRecords.length}\n`;

  for (let record of financeRecords) {
    financesResults += `Agreement Date: ${record.AgreementDate}\n`;
    financesResults += `Agreement Term: ${record.AgreementTerm} months`;
    financesResults += `Agreement Type: ${record.AgreementType}\n`;
    financesResults += `Finance Company: ${record.FinanceCompany || "N/A"}\n`;
    financesResults += `Vehicle Description: ${
      record.VehicleDescription || "N/A"
    }\n`;
  }

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
    importantChecksResults += `VIN Last 5 Digits: ${vinLast5}\n`;

    let engineNumber = importantChecksRecords.EngineNumber;
    importantChecksResults += `Engine Number: ${engineNumber}\n`;

    importantChecksResults += `Number of v5c Certificates: ${v5cCount}`;

    if (v5cCertificateList && v5cCertificateList[0].CertificateDate) {
      let certificateDate = v5cCertificateList[0].CertificateDate;
      importantChecksResults += `V5C Date: ${certificateDate}\n`;
    } else {
      importantChecksResults += "No V5C Date available\n";
    }
  } catch (e) {
    importantChecksResults += `An error occurred: ${e.message}\n`;
  }

  return importantChecksResults;
}

function extractStolenInfo(vdiCheckFull) {
  let stolenInfoResults = "\nTopic: Stolen\n";

  try {
    if (!vdiCheckFull.StolenStatus) {
      throw new Error("The vehicle is not reported as stolen");
    }
    stolenInfoResults += `\n Sub Topic: Status: ${vdiCheckFull.StolenStatus}`;
    stolenInfoResults += `\n Sub Topic: Contact Number: ${vdiCheckFull.StolenContactNumber}`;
    stolenInfoResults += `\n Sub Topic: Date: ${vdiCheckFull.StolenDate}`;
    stolenInfoResults += `\n Sub Topic: Police Force: ${vdiCheckFull.StolenPoliceForce}`;
    stolenInfoResults += `\n Sub Topic: Information Source: ${vdiCheckFull.StolenInfoSource}`;
  } catch (e) {
    stolenInfoResults += e.message;
  }
  return stolenInfoResults;
}

function extractImportExportInfo(vehicleRegistration) {
  let exportResults = "\nTopic: Import / Export \n";

  if (!vehicleRegistration) {
    return exportResults + "Vehicle registration data is not provided";
  }

  let result = [
    ["DateFirstRegistered", vehicleRegistration.DateFirstRegistered],
    ["Imported", vehicleRegistration.Imported ? "Yes" : "No"],
    [
      "ImportDate",
      vehicleRegistration.Imported
        ? vehicleRegistration.DateFirstRegistered
        : null,
    ],
    [
      "ImportUsedBeforeUKRegistration",
      vehicleRegistration.VehicleUsedBeforeFirstRegistration ? "Yes" : "No",
    ],
    ["ImportedFromOutsideEU", vehicleRegistration.ImportNonEu ? "Yes" : "No"],
    ["Exported", vehicleRegistration.Exported ? "Yes" : "No"],
    [
      "ExportDate",
      vehicleRegistration.Exported ? vehicleRegistration.DateExported : null,
    ],
  ];

  for (let item of result) {
    exportResults += `${item[0]}: ${item[1]}\n`;
  }

  return exportResults;
}

function extractWriteOffInfo(vdiCheckFull) {
  let writeOffResults = "\nTopic: Write Off \n";

  let recordCount = vdiCheckFull.WriteOffRecordCount || 0;
  // Define category
  let category = "";
  let categoryScore = 0;
  let recordCountScore = 0;

  let result = [
    ["Record Count", recordCount, recordCountScore],
    ["Category", category, categoryScore],
  ];

  for (let item of result) {
    writeOffResults += `${item[0]}: ${item[1]}\n`;
  }

  let writeOffRecordList = vdiCheckFull.WriteOffRecordList || [];

  if (writeOffRecordList.length > 0) {
    for (let idx = 0; idx < writeOffRecordList.length; idx++) {
      let record = writeOffRecordList[idx];
      let miaftrEntryDate = record.MiaftrEntryDate || "N/A";
      let lossDate = record.LossDate || "N/A";
      let lossType = record.LossType || "N/A";
      let category = record.Category || "N/A";

      writeOffResults += `Write Off Record ${
        idx + 1
      }: MiaftrEntryDate: ${miaftrEntryDate}, LossDate: ${lossDate}, LossType: ${lossType}, Category: ${category}\n`;
    }
  }

  return writeOffResults;
}

function extractVICInfo(vehicleHistory) {
  let vicResults = "\nTopic: VIC \n";

  let vicList =
    Array.isArray(vehicleHistory.VicList) && vehicleHistory.VicList.length > 0
      ? vehicleHistory.VicList
      : null;

  if (!vicList) {
    vicResults += "No VIC test detected.";
  } else {
    vicResults += "VIC test detected.\n";
    for (let i = 0; i < vicList.length; i++) {
      let vic = vicList[i];
      vicResults += `VIC Entry ${i + 1}:\n`;
      for (let key in vic) {
        if (vic.hasOwnProperty(key)) {
          vicResults += `${key}: ${vic[key]}\n`;
        }
      }
    }
  }

  return vicResults;
}

function extractSalvage(salvage) {
  let salvageResults = "\nTopic: Salvage\n";

  if (salvage.salvage_auction_record_found) {
    salvageResults += "Salvage record found.\n";

    salvage.salvage_auction_records.forEach((record, i) => {
      salvageResults += `\n=== Salvage Record ${i + 1} ===\n`;

      const {
        salvage_auction_record_id,
        salvage_auction_lot_desc,
        salvage_auction_lot_date,
        mileage,
        primary_damage_desc,
        secondary_damage_desc,
      } = record;

      salvageResults += `Record ID: ${salvage_auction_record_id}\n`;
      salvageResults += `Lot Description: ${salvage_auction_lot_desc}\n`;
      salvageResults += `Lot Date: ${salvage_auction_lot_date}\n`;
      salvageResults += `Mileage: ${mileage}\n`;
      salvageResults += `Primary Damage: ${primary_damage_desc}\n`;
      salvageResults += `Secondary Damage: ${secondary_damage_desc}\n`;
    });
  } else {
    salvageResults += "No salvage record found.\n";
  }

  return salvageResults;
}

function extractTaxi(taxi) {
  let taxiResults = "\nTopic: Taxi\n";

  if (taxi.is_possible_taxi) {
    taxiResults += "Taxi record found.\n";
  } else {
    taxiResults += "No taxi record found.\n";
  }

  return taxiResults;
}

export default dataExtract;
