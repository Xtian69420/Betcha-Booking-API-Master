const OTP = require('../collection/OTP');
const crypto = require('crypto'); 
const nodemailer = require('nodemailer');

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateOTP = () => (crypto.randomInt ? crypto.randomInt(100000, 999999) : randomInt(100000, 999999));

exports.createOtp = async (req, res) => {
    const { userId, email } = req.body;

    try {
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

        const newOtp = await OTP.create({ userId, otp, expiresAt });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'betcha.booking.webapp@gmail.com',
                pass: 'BetchaBooking2024'
            }
        });

        await transporter.sendMail({
            from: '"OTP Service" betcha.booking.webapp@gmail.com',
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`
        });

        res.status(201).send({ message: 'OTP sent successfully!', otpId: newOtp._id });
    } catch (err) {
        res.status(500).send({ error: 'Failed to generate OTP', details: err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    const { userId, otp } = req.body;

    try {
        const otpRecord = await OTP.findOne({ userId });

        if (!otpRecord) {
            return res.status(404).send({ error: 'OTP not found.' });
        }

        if (otpRecord.expiresAt < new Date()) {
            return res.status(400).send({ error: 'OTP has expired.' });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).send({ error: 'Invalid OTP.' });
        }

        res.send({ message: 'OTP verified successfully!' });
    } catch (err) {
        res.status(500).send({ error: 'Failed to verify OTP', details: err.message });
    }
};


exports.deleteOtp = async (req, res) => {
    const { userId } = req.body;

    try {
        await OTP.deleteOne({ userId });
        res.send({ message: 'OTP deleted successfully!' });
    } catch (err) {
        res.status(500).send({ error: 'Failed to delete OTP', details: err.message });
    }
};

exports.resendOtp = async (req, res) => {
    const { userId, email } = req.body;

    try {

        await OTP.deleteOne({ userId });

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const newOtp = await OTP.create({ userId, otp, expiresAt });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'your-email@gmail.com',
                pass: 'your-email-password'
            }
        });

        await transporter.sendMail({
            from: '"OTP Service" <your-email@gmail.com>',
            to: email,
            subject: 'Your New OTP Code',
            text: `Your new OTP code is: ${otp}`
        });

        res.status(201).send({ message: 'OTP resent successfully!', otpId: newOtp._id });
    } catch (err) {
        res.status(500).send({ error: 'Failed to resend OTP', details: err.message });
    }
};