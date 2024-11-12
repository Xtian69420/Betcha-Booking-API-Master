const mongoose = require('mongoose');

const allUnits = new mongoose.Schema({
    Unit: { type: String },
    NumOfBookings: { type: Number, min: 1, required: true },
    EarningsPerUnits: { type: Number, require: true },
});

const TopUnitSchema = new mongoose.Schema({
    UnitData: [allUnits]
},{
    collection: 'top_unit_tb'
})

module.exports = mongoose.model('TopUnits', TopUnitSchema);