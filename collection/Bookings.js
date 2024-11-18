const mongoose = require('mongoose');

const BookingSchema = mongoose.Schema({
    Reference: {type: String, required: true},
    StartDate: { type: String, required: true},
    EndDate: {  type: String, required: true},
    Unit: { type: String, required: true },
    UnitPrice: { type: String, required: true },
    PricePerPax: { type: Number, required: true },
    AdditionalPax: { type: Number, min: 1, required: true },
    Reservation: { type: Number, Default: 500 },
    isSuccess: { type: Boolean, Default: false, set: v => v === 'TRUE' },
    Status: { type: String, Default: "No status" },
    Total: { type: Number, required: true }
},{
    collection: 'bookings_tb'
})

module.exports = mongoose.model('Bookings', BookingSchema);