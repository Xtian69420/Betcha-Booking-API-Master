const PaymentModel = require('../collection/Payment');
const BookingModel = require('../collection/Bookings');
const fetch = require('node-fetch');
require('dotenv').config();

const payMongoApiUrl = process.env.PAYMONGO_API_URL;
const payMongoApiKey = process.env.PAYMONGO_API_KEY;

const generatePaymentLink = async (amount, description) => {
    const response = await fetch(payMongoApiUrl, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(payMongoApiKey + ':').toString('base64'),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: {
                attributes: {
                    amount: amount * 100, 
                    description: description,
                    remarks: 'Payment',
                },
            },
        }),
    });

    return response.json();
};

exports.PaymentReservation = async (req, res) => {
    const { ref, amount, userId, unitId } = req.body;

    try {
        const apiResponse = await generatePaymentLink(amount, 'Reservation');

        if (apiResponse.data) {
            const paymentData = {
                Reference: ref,
                Date: new Date().toISOString(),
                Mop: 'N/A',  
                UserId: userId,
                UnitId: unitId,
                Amount: amount,
                Description: 'Reservation',
                Status: 'Pending',  
                PayMongoLink: apiResponse.data.id, 
            };

            const newPayment = new PaymentModel(paymentData);
            await newPayment.save();

            const updatedBooking = await BookingModel.findOneAndUpdate(
                { Reference: ref },
                { PaymentId: newPayment._id }, 
                { new: true }
            );

            res.status(200).json({
                message: 'Payment link created successfully.',
                paymentLink: apiResponse.data.attributes.checkout_url,
                paymentDetails: newPayment,
                bookingDetails: updatedBooking,
            });
        } else {
            res.status(400).json({ error: 'Failed to create payment link.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.FullPayment = async (req, res) => {
    const { ref, amount, userId, unitId } = req.body;

    try {
        const apiResponse = await generatePaymentLink(amount, 'Full Payment');
        console.log(apiResponse);
        if (apiResponse.data) {
            const paymentData = {
                Reference: ref,
                Date: new Date().toISOString(),
                Mop: 'N/A',
                UserId: userId,
                UnitId: unitId,
                Amount: amount,
                Description: 'Full Payment',
                Status: 'Pending',
                PayMongoLink: apiResponse.data.id,  
            };

            const newPayment = new PaymentModel(paymentData);
            await newPayment.save();

            const updatedBooking = await BookingModel.findOneAndUpdate(
                { Reference: ref },
                { PaymentId: newPayment._id },  
                { new: true }
            );

            res.status(200).json({
                message: 'Payment link created successfully.',
                paymentLink: apiResponse.data.attributes.checkout_url,
                paymentDetails: newPayment,
                bookingDetails: updatedBooking,
            });
        } else {
            res.status(400).json({ error: 'Failed to create payment link.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const fetchPaymentDetails = async (paymentId) => {
    const response = await fetch(`https://api.paymongo.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(payMongoApiKey + ':').toString('base64'),
        },
    });

    return response.json();
};

exports.getPaymentDetails = async (req, res) => {
    const { linkId } = req.params;

    try {
        const linkResponse = await fetch(`https://api.paymongo.com/v1/links/${linkId}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(payMongoApiKey + ':').toString('base64'),
            },
        });

        if (!linkResponse.ok) {
            console.error('Error fetching link details:', await linkResponse.json());
            return res.status(404).json({ error: 'Link not found or API request failed.' });
        }

        const linkDetails = await linkResponse.json();
        const payments = linkDetails?.data?.attributes?.payments || [];

        if (payments.length === 0) {
            return res.status(404).json({ error: 'No payments associated with this link.' });
        }

        for (let payment of payments) {
            const paymentId = payment.data.id;
            const paymentDetails = await fetchPaymentDetails(paymentId);

            if (paymentDetails && paymentDetails.data) {
                const status = paymentDetails.data.attributes.status;
                const mop = paymentDetails.data.attributes.source.type;
                const updatedPayment = await PaymentModel.findOne({ PayMongoLink: linkId });

                if (updatedPayment) {

                    if (updatedPayment.Description === 'Reservation') {
                        updatedPayment.Status = status === 'paid' ? 'Reserved' : 'Failed';
                    } else if (updatedPayment.Description === 'Full Payment') {
                        updatedPayment.Status = status === 'paid' ? 'Fully-Paid' : 'Failed';
                    }
                    updatedPayment.Mop = mop;
                    updatedPayment.PaymentId = paymentId;

                    await updatedPayment.save();

                    if (status === 'paid') {
                        const bookingStatus = updatedPayment.Description === 'Reservation' ? 'Reserved' : 'Fully-Paid';

                        const updatedBooking = await BookingModel.findOneAndUpdate(
                            { Reference: updatedPayment.Reference },
                            { Status: bookingStatus },             
                            { new: true }                          
                        );

                        if (!updatedBooking) {
                            console.error('Booking not found for reference:', updatedPayment.Reference);
                            const status = paymentDetails.data.attributes.status;
                            const mop = paymentDetails.data.attributes.source.type;
                            const updatedPayment = await PaymentModel.findOne({ PayMongoLink: linkId });

                            return res.status(404).json({ error: 'Associated booking not found.' });
                        }
                    }

                    return res.status(200).json({
                        message: 'Payment and booking details retrieved and updated successfully.',
                        paymentDetails: updatedPayment,
                    });
                } else {
                    const payment = await PaymentModel.findOne({ PayMongoLink: linkId });
                    
                    if (payment) {
                        payment.Status = 'Payment Failed';
                        await payment.save();

                        const booking = await BookingModel.findOneAndUpdate(
                            { Reference: payment.Reference }, 
                            { Status: 'Cancelled' }, 
                            { new: true }
                        );
                
                        if (!booking) {
                            console.error('Booking not found for reference:', payment.Reference);
                            return res.status(404).json({ error: 'Associated booking not found.' });
                        }
                
                        return res.status(200).json({
                            message: 'Payment Failed: Your Booking was cancelled',
                            paymentDetails: payment,
                            bookingDetails: booking,
                        });
                    } else {
                        return res.status(404).json({ error: 'Payment record not found.' });
                    }
                }                    
            } else {
                return res.status(404).json({ error: 'Payment details not found.' });
            }
        }
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({ error: 'Failed to fetch payment details.' });
    }
};


exports.getAllPayments = async (req, res) => {
    try {
        const payments = await PaymentModel.find({});
        res.status(200).json({ payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
};

exports.getAllPaymentsByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const payments = await PaymentModel.find({ UserId: userId });
        res.status(200).json({ payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user payments' });
    }
};

exports.getAllPaymentsByUnit = async (req, res) => {
    const { unitId } = req.params;

    try {
        const payments = await PaymentModel.find({ UnitId: unitId });
        res.status(200).json({ payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch unit payments' });
    }
};

exports.getPaymentLink = async (req, res) => {
    const { reference } = req.params;
    try {
        const payments = await PaymentModel.find({ Reference: reference });
        res.status(200).json( payments );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch PaymentLink' });
    }
};