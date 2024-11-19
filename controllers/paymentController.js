const PaymentModel = require('../collection/Payment');
const crypto = require('crypto');
const fetch = require('node-fetch');

const payMongoApiUrl = 'https://api.paymongo.com/v1/links';
const payMongoApiKey = 'sk_test_FY8RJmTrGqyv1peKyRq31rh2';

const generatePaymentLink = async (amount, description) => {
    const response = await fetch(payMongoApiUrl, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(payMongoApiKey).toString('base64'),
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
                PayMongoId: apiResponse.data.id, 
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

exports.FullPayment = async (req, res) => {
    const { amount, userId, unitId } = req.body;

    try {
        const apiResponse = await generatePaymentLink(amount, 'Full Payment');

        if (apiResponse.data) {
            const paymentData = {
                Date: new Date().toISOString(),
                Mop: 'Pending',
                UserId: userId,
                UnitId: unitId,
                Amount: amount,
                Description: 'Full Payment',
                Status: 'Pending',
                PayMongoId: apiResponse.data.id,
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
        const payments = await PaymentModel.find({ UserId: userId, Status: 'Successful' });
        res.status(200).json({ payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user payments' });
    }
};

exports.getAllPaymentsByUnit = async (req, res) => {
    const { unitId } = req.params;

    try {
        const payments = await PaymentModel.find({ UnitId: unitId, Status: 'Successful' });
        res.status(200).json({ payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch unit payments' });
    }
};

exports.handleWebhook = async (req, res) => {
    try {

        const sig = req.headers['paymongo-signature']; 
        const payload = JSON.stringify(req.body); 

        const hmac = crypto.createHmac('sha256', payMongoApiKey);
        hmac.update(payload);
        const expectedSig = hmac.digest('hex');

        if (sig !== expectedSig) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body.data;
        const eventType = event.type;

        switch (eventType) {
            case 'payment.paid':
                await handlePaymentPaid(event);  
                break;
            case 'payment.failed':
                await handlePaymentFailed(event);  
                break;
            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        return res.status(200).send('Webhook received and processed successfully');
    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const handlePaymentPaid = async (event) => {
    const paymentId = event.data.id; 
    const status = 'Successful'; 
    const mop = 'PayMongo'; 

    await PaymentModel.updateOne(
        { PayMongoId: paymentId },
        { $set: { Status: status, Mop: mop } }
    );

    console.log(`Payment ${paymentId} was successful.`);
};

const handlePaymentFailed = async (event) => {
    const paymentId = event.data.id;
    const status = 'Failed'; 

    await PaymentModel.updateOne(
        { PayMongoId: paymentId },
        { $set: { Status: status } }
    );

    console.log(`Payment ${paymentId} failed.`);
};
