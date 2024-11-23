const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
});

module.exports = mongoose.model('OTP', otpSchema);