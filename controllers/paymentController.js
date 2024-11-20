const PaymentModel = require('../collection/Payment');
const fetch = require('node-fetch');
const crypto = require('crypto');

const payMongoApiUrl = 'https://api.paymongo.com/v1/links';
const payMongoApiKey = 'sk_test_FY8RJmTrGqyv1peKyRq31rh2'; 
const webhookSecret = 'whsk_FFRGe9LnK7zvAGMy5dDzMm4K';

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
    const { amount, userId, unitId } = req.body;

    try {
        const apiResponse = await generatePaymentLink(amount, 'Reservation');

        if (apiResponse.data) {
            const paymentData = {
                Date: new Date().toISOString(),
                Mop: 'Pending',  
                UserId: userId,
                UnitId: unitId,
                Amount: amount,
                Description: 'Reservation',
                Status: 'Pending',  
                PayMongoLink: apiResponse.data.attributes.checkout_url, 
            };

            const newPayment = new PaymentModel(paymentData);
            await newPayment.save();

            res.status(200).json({
                message: 'Payment link created successfully.',
                paymentLink: apiResponse.data.id,
                paymentDetails: newPayment,
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
    const { amount, userId, unitId } = req.body;

    try {
        const apiResponse = await generatePaymentLink(amount, 'Full Payment');
        console.log(apiResponse);
        if (apiResponse.data) {
            const paymentData = {
                Date: new Date().toISOString(),
                Mop: 'Pending',
                UserId: userId,
                UnitId: unitId,
                Amount: amount,
                Description: 'Full Payment',
                Status: 'Pending',
                PayMongoLink: apiResponse.data.id, 
            };

            const newPayment = new PaymentModel(paymentData);
            await newPayment.save();

            res.status(200).json({
                message: 'Payment link created successfully.',
                paymentLink: apiResponse.data.attributes.checkout_url,
                paymentDetails: newPayment,
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
        // Fetch details of the payment link
        const linkResponse = await fetch(`https://api.paymongo.com/v1/links/${linkId}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(payMongoApiKey + ':').toString('base64'),
            },
        });

        const linkDetails = await linkResponse.json();

        // Ensure payments exist for this link
        const payments = linkDetails?.data?.attributes?.payments || [];
        if (payments.length === 0) {
            return res.status(404).json({ error: 'No payments associated with this link.' });
        }

        // Fetch the first payment's details
        const paymentId = payments[0].id;
        const paymentDetails = await fetchPaymentDetails(paymentId);

        if (paymentDetails.data) {
            const status = paymentDetails.data.attributes.status;
            const mop = paymentDetails.data.attributes.source.type;

            // Update payment record in the database
            const updatedPayment = await PaymentModel.findOneAndUpdate(
                { PayMongoLink: linkId }, // Match link ID
                {
                    $set: {
                        Status: status === 'paid' ? 'Successful' : 'Failed',
                        Mop: mop,
                        PaymentId: paymentId,
                    },
                },
                { new: true }
            );

            if (updatedPayment) {
                return res.status(200).json({
                    message: 'Payment details retrieved and updated successfully.',
                    paymentDetails: updatedPayment,
                });
            } else {
                return res.status(404).json({ error: 'Payment record not found in the database.' });
            }
        } else {
            return res.status(404).json({ error: 'Payment details not found.' });
        }
    } catch (error) {
        console.error(error);
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

exports.webhook = async (req, res) => {
    const signature = req.headers['x-paymongo-signature'];  // Get the signature from the headers
    const body = JSON.stringify(req.body);  // Get the raw body data

    // Verify the signature
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body.data;

    try {
        // Handle different event types
        switch (event.type) {
            case 'payment.paid':
                // Payment was successful
                const paymentData = event.attributes;
                const paymentId = paymentData.id;
                const status = paymentData.status;

                // Update payment record in your database
                const updatedPayment = await PaymentModel.findOneAndUpdate(
                    { PayMongoLink: paymentData.link_id },
                    {
                        $set: {
                            Status: status === 'paid' ? 'Successful' : 'Failed',
                            PaymentId: paymentId,
                        },
                    },
                    { new: true }
                );

                return res.status(200).json({
                    message: 'Payment processed successfully.',
                    paymentDetails: updatedPayment,
                });

            case 'payment.failed':
                // Payment failed
                const failedPaymentData = event.attributes;
                const failedPaymentId = failedPaymentData.id;

                // Optionally, update the payment status in your database as failed
                await PaymentModel.findOneAndUpdate(
                    { PayMongoLink: failedPaymentData.link_id },
                    {
                        $set: {
                            Status: 'Failed',
                            PaymentId: failedPaymentId,
                        },
                    }
                );

                return res.status(200).json({
                    message: 'Payment failed processed.',
                });

            // Add other event types you want to handle

            default:
                return res.status(400).json({ error: 'Unknown event type' });
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ error: 'Failed to process webhook' });
    }
};
