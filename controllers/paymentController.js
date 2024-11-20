const PaymentModel = require('../collection/Payment');
const fetch = require('node-fetch');

const payMongoApiUrl = 'https://api.paymongo.com/v1/links';
const payMongoApiKey = 'sk_test_FY8RJmTrGqyv1peKyRq31rh2'; 

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


exports.Webhook = async (req, res) => {
    const webhookSecret = 'whsk_KRRDvpWGu5XD7phB4SWpXEWe';

    try {
        // Ensure rawBody is captured
        if (!req.rawBody) {
            console.error('Raw body is undefined.');
            return res.status(400).send('Bad Request: Missing raw body');
        }

        // Log raw body for debugging
        console.log('Incoming raw body:', req.rawBody.toString());

        // Validate signature
        const signatureHeader = req.headers['paymongo-signature'];
        if (!signatureHeader) {
            console.error('Signature header missing.');
            return res.status(400).send('Bad Request: Missing signature header');
        }

        console.log('PayMongo Signature Header:', signatureHeader);

        const computedHmac = crypto
            .createHmac('sha256', webhookSecret)
            .update(req.rawBody)
            .digest('hex');

        const signatureParts = signatureHeader.split(',');
        const tePart = signatureParts.find(part => part.startsWith('te=')).split('=')[1];

        if (computedHmac !== tePart) {
            console.error('Signature mismatch. Invalid signature.');
            return res.status(401).send('Unauthorized: Invalid signature');
        }

        // Process the event
        const payload = JSON.parse(req.rawBody.toString());
        console.log('Webhook payload:', payload);

        const eventType = payload.data.attributes.type;
        console.log('Webhook Event Type:', eventType);

        switch (eventType) {
            case 'payment.paid':
                console.log('Processing payment.paid event.');
                break;
            case 'payment.failed':
                console.log('Processing payment.failed event.');
                break;
            default:
                console.warn(`Unhandled event type: ${eventType}`);
        }

        res.status(200).send('Webhook processed successfully');
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).send('Internal Server Error');
    }
};
