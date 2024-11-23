const OTP = require('../collection/OTP');
const crypto = require('crypto'); 
const sgMail = require('@sendgrid/mail'); 
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateOTP = () => (crypto.randomInt ? crypto.randomInt(100000, 999999) : randomInt(100000, 999999));

exports.createOtp = async (req, res) => {
    const { userId, email } = req.body;

    try {
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); 

        const newOtp = await OTP.create({ userId, otp, expiresAt });

        // update later
        const msg = {
            to: email, 
            from: 'betcha.booking.webapp@gmail.com', 
            subject: 'Your OTP Code',
            text: `Your OTP code is: ${otp}`,
        };

        await sgMail.send(msg);  

        res.status(201).send({ message: 'OTP sent successfully!', otpId: newOtp._id });
        console.log('OTP sent to:', email);
        console.log('Generated OTP:', otp);
        console.log('Expires At:', expiresAt);

    } catch (err) {

        console.error('Error sending OTP:', err);
        res.status(500).send({ error: 'Failed to generate OTP', details: err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    const { userId, otp, email } = req.body;

    try {
        const otpRecord = await OTP.findOne({ userId });

        if (!otpRecord) {
            return res.status(404).send({ error: 'OTP not found.' });
        }

        if (otpRecord.isUsed) {
            return res.status(400).send({ error: 'OTP already used.' });
        }

        if (otpRecord.expiresAt < new Date()) {
            return res.status(400).send({ error: 'OTP has expired.' });
        }

        if (otpRecord.otp.toString() !== otp.toString()) {
            return res.status(400).send({ error: 'Invalid OTP.' });
        }

        otpRecord.isUsed = true;
        await otpRecord.save();

        await OTP.deleteMany({ userId });  

        const msg = {
            to: email,
            from: 'betcha.booking.webapp@gmail.com', 
            subject: 'Welcome to Betcha by Homie House Booking!',
            html: `
                <html>
                    <head>
                        <style>
                            body {
                                font-family: 'Arial', sans-serif;
                                color: #fff;
                                background-color: #f4f4f4;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                width: 100%;
                                max-width: 600px;
                                margin: 0 auto;
                                background-color: #fff;
                                padding: 20px;
                                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            }
                            h1 {
                                font-size: 24px;
                                color: #2a9d8f;
                                text-align: center;
                            }
                            p {
                                font-size: 16px;
                                line-height: 1.5;
                                margin-bottom: 20px;
                                color: #333;
                            }
                            .cta-buttons-container {
                                text-align: center;
                                margin-top: 20px;
                            }
                            .cta-button {
                                display: inline-block;
                                background-color: #2a9d8f;
                                color: #fff; /* Text color inside the button */
                                text-align: center;
                                padding: 12px 30px;
                                font-size: 16px;
                                text-decoration: none;
                                border-radius: 4px;
                                margin: 10px;
                            }
                            /* Ensure that links inside the footer or buttons don't appear blue */
                            a {
                                color: #fff; /* Set the text color of all links to white */
                                text-decoration: none; /* Remove underlining from links */
                            }
                            .footer {
                                text-align: center;
                                font-size: 14px;
                                color: #888;
                                padding: 20px;
                            }
                            .footer a {
                                color: #2a9d8f; /* Color for footer links */
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Welcome to Betcha by Homie House Booking!</h1>
                            <p>Hello,</p>
                            <p>Thank you for signing up with Betcha by Homie House Booking! We are thrilled to have you as part of our community. You can now browse and make bookings at your convenience.</p>
                            <p>If you have any questions or need assistance, don't hesitate to reach out to us.</p>

                            <div class="cta-buttons-container">
                                <p><a href="https://www.facebook.com/betchabyhomiehouse" class="cta-button">Visit Our Social Media</a></p>
                                <p><a href="https://beta-betcha-booking.netlify.app/" class="cta-button">Visit Our Website</a></p>
                            </div>

                            <div class="footer">
                                <p>Best regards,</p>
                                <p>The Betcha Team</p>
                                <p><a href="https://beta-betcha-booking.netlify.app/">Visit Our Website</a> | <a href="mailto:support@betcha.com">Contact Support</a></p>
                                <p>&copy; 2024 Betcha by Homie House Booking, All Rights Reserved.</p>
                            </div>
                        </div>
                    </body>
                </html>
            `
        };     

        try {
            await sgMail.send(msg);
            console.log('Welcome email sent to:', email);
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return res.status(500).send({ error: 'Failed to send welcome email', details: error.message });
        }

        res.send({ message: 'OTP verified successfully! Welcome email sent.' });

        console.log('OTP verified for user:', userId);
        console.log('Welcome email sent to:', email);

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

        const msg = {
            to: email,
            from: 'betcha.booking.webapp@gmail.com', 
            subject: 'Your New OTP Code',
            text: `Your new OTP code is: ${otp}`,
        };

        await sgMail.send(msg);

        res.status(201).send({ message: 'OTP resent successfully!', otpId: newOtp._id });
    } catch (err) {
        res.status(500).send({ error: 'Failed to resend OTP', details: err.message });
    }
};
