const mongoose = require('mongoose');

// Image Schema (referenced in UnitSchema)
const ImageSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    name: { type: String, required: true },
    fileId: { type: String, required: true },
    contentType: { type: String, required: true }
});

// Schema for individual units in the top units collection
const allUnits = new mongoose.Schema({
    Unit: { type: String },
    NumOfBookings: { type: Number, min: 1, required: true },
    EarningsPerUnits: { type: Number, required: true },
    UnitImages: [ImageSchema]  // Include UnitImages field
});

// Top Units collection schema
const TopUnitSchema = new mongoose.Schema({
    UnitData: [allUnits]
}, {
    collection: 'top_unit_tb'
});

module.exports = mongoose.model('TopUnits', TopUnitSchema);