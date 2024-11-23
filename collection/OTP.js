const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    otp: { type: Number, required: true },
    expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model('OTP', OtpSchema);