const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    name: { type: String, required: true },
    fileId: { type: String, required: true },
    contentType: { type: String, required: true }
});
// remove inclusion and change it to amenities boolean
const UnitSchema = new mongoose.Schema({
    Top: { type: Number, required: true, min: 1 },
    unitName: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    description: { type: String, default: "" },
    inclusion: { type: String, default: "" },
    unitPrice: { type: Number, required: true },
    isAvailable: { type: Boolean, default: false, set: v => v === 'TRUE' },
    maxPax: { type: Number, required: true, min: 1 },
    pricePerPax: { type: Number, required: true },
    UnitImages: [ImageSchema] 
    // create a fields for bookDates
}, {
    collection: 'unit_tb'
});

module.exports = mongoose.model('Unit', UnitSchema);