class CarDetailsModel {
	constructor(
		registrationNumber,
		taxStatus,
		taxDueDate,
		motStatus,
		make,
		yearOfManufacture,
		engineCapacity,
		co2Emissions,
		fuelType,
		markedForExport,
		colour,
		typeApproval,
		revenueWeight,
		euroStatus,
		dateOfLastV5CIssued,
		motExpiryDate,
		wheelplan,
		monthOfFirstRegistration
	) {
		this.registrationNumber = registrationNumber;
		this.taxStatus = taxStatus;
		this.taxDueDate = taxDueDate;
		this.motStatus = motStatus;
		this.make = make;
		this.yearOfManufacture = yearOfManufacture;
		this.engineCapacity = engineCapacity;
		this.co2Emissions = co2Emissions;
		this.fuelType = fuelType;
		this.markedForExport = markedForExport;
		this.colour = colour;
		this.typeApproval = typeApproval;
		this.revenueWeight = revenueWeight;
		this.euroStatus = euroStatus;
		this.dateOfLastV5CIssued = dateOfLastV5CIssued;
		this.motExpiryDate = motExpiryDate;
		this.wheelplan = wheelplan;
		this.monthOfFirstRegistration = monthOfFirstRegistration;
	}
}