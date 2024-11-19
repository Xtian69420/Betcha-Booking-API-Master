const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    name: { type: String, required: true },
    fileId: { type: String, required: true },
    contentType: { type: String, required: true }
});

const UnitSchema = new mongoose.Schema({
    Top: { type: Number, required: false, min: 1 },
    unitName: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    description: { type: String, default: "" },
    amenities: {
        towels: { type: Boolean, default: false },
        toiletPaper: { type: Boolean, default: false },
        soapAndShampoo: { type: Boolean, default: false },
        hotWater: { type: Boolean, default: false },
        comfortableBed: { type: Boolean, default: false },
        washingMachineAndDryer: { type: Boolean, default: false },
        closetsOrDrawers: { type: Boolean, default: false },
        television: { type: Boolean, default: false },
        streamingServices: { type: Boolean, default: false },
        booksOrBoardGames: { type: Boolean, default: false },
        airConditioning: { type: Boolean, default: false },
        ceilingFans: { type: Boolean, default: false },
        smokeDetectors: { type: Boolean, default: false },
        fireExtinguisher: { type: Boolean, default: false },
        firstAidKit: { type: Boolean, default: false },
        secureLocks: { type: Boolean, default: false },
        freeWiFi: { type: Boolean, default: false },
        stoveAndOven: { type: Boolean, default: false },
        refrigerator: { type: Boolean, default: false },
        microwave: { type: Boolean, default: false },
        cookingUtensils: { type: Boolean, default: false },
        coffeeMaker: { type: Boolean, default: false },
        balconyOrTerrace: { type: Boolean, default: false },
        privateGarden: { type: Boolean, default: false },
        swimmingPoolAccess: { type: Boolean, default: false },
        parkingFacilities: { type: Boolean, default: false },
        parkingSpace: { type: Boolean, default: false },
        gymAccess: { type: Boolean, default: false },
        elevator: { type: Boolean, default: false },
    },
    otherAmenities: { type: String, default: "" },
    unitPrice: { type: Number, required: true },
    reservation: { type: Number, default: 500 },
    isAvailable: { type: Boolean, default: false },
    maxPax: { type: Number, required: true, min: 1 },
    pricePerPax: { type: Number, required: true },
    UnitImages: [ImageSchema]
}, {
    collection: 'unit_tb'
});

module.exports = mongoose.model('Unit', UnitSchema);