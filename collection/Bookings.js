const mongoose = require('mongoose');

const BookingSchema = mongoose.Schema({
    Reference: { type: String, required: true },
    CheckIn: { type: String, required: true },
    CheckOut: { type: String, required: true },
    UnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true }, 
    AdditionalPax: { type: Number, min: 1, required: true },
    Reservation: { type: Number, Default: 500 },
    isSuccess: { type: Boolean, Default: false, set: v => v === 'TRUE' },
    Status: { type: String, Default: "No status" },
    Total: { type: Number, required: true }
},{
    collection: 'bookings_tb'
})
module.exports = mongoose.model('Bookings', BookingSchema);