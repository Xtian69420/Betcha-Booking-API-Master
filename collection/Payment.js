const mongoose = require('mongoose');

const PaymentSchema = mongoose.Schema({
    Date: { type: String, required: true },
    Mop: { type: String, required: true }, 
    UserId: { type: String, required: true },
    UnitId: { type: String, required: true },
    Amount: { type: Number, required: true },
    Description: { type: String, required: true },
    Status: { type: String, required: true, default: 'Pending' },
    PayMongoLink: { type: String, required: true },
    PaymentId: { type: String }
    // isTrue
}, {
    collection: 'payments_tb',
});

module.exports = mongoose.model('Payments', PaymentSchema);