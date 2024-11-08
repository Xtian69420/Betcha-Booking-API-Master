const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({

    unitName: {type: String, required: true, unique: true},
    location: {type: String, required: true },
    description: {type: String, required: false, default: ""},
    inclusion: {type: String, required: false, default: ""},
    unitPrice: {type: Number, required: true},
    isAvailable: {type: Boolean, required: false, default: false, set: v => v === 'TRUE'},
    maxPax: {type: Number, required: true, min: 1, integer: true},
    pricePerPax: {type: Number, required: true}
}, {
    collection: 'unit_tb'  
});

module.exports = mongoose.model('Unit', UnitSchema);