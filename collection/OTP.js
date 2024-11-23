const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    otp: { type: Number, required: true },
    expiresAt: { type: Date, required: true, index: { expires: '5m' } },
    isUsed: { type: Boolean, default: false }
});

module.exports = mongoose.model('OTP', OtpSchema);
