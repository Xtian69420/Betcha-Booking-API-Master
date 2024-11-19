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
        const sig = req.headers['paymongo-signature'];  // PayMongo's signature from the header
        const payload = JSON.stringify(req.body);  // The body of the webhook request
        
        // Validate the webhook signature
        const hmac = crypto.createHmac('sha256', payMongoApiKey);
        hmac.update(payload);
        const expectedSig = hmac.digest('hex');

        if (sig !== expectedSig) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Extract event and event type from webhook payload
        const event = req.body.data;
        const eventType = event.type;

        // You can save the full webhook payload (or just the signature, based on your needs)
        const webhookData = {
            webhookSignature: sig,
            webhookPayload: JSON.stringify(req.body)  // Save the full payload, or adjust as needed
        };

        // Optional: Save the signature and payload to a specific payment entry if you want to link it
        // Assuming the event contains a payment ID, you can save the webhook details to the related payment
        if (eventType === 'payment.paid' || eventType === 'payment.failed') {
            const paymentId = event.data.id;
            await PaymentModel.updateOne(
                { PayMongoId: paymentId },
                { $set: { webhook: webhookData } } // Save the webhook signature and payload to the payment
            );
        }

        // Handle different events
        switch (eventType) {
            case 'source.chargeable':
                await handleSourceChargeable(event);
                break;
            case 'payment.paid':
                await handlePaymentPaid(event);
                break;
            case 'payment.failed':
                await handlePaymentFailed(event);
                break;
            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        // Respond to acknowledge receipt of the webhook
        return res.status(200).send('Webhook received successfully');
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const handleSourceChargeable = async (event) => {
    const sourceId = event.data.id;
    const amount = event.data.attributes.amount / 100;  // Convert to proper amount (PayMongo sends amount in cents)
    const status = 'Chargeable';

    const paymentData = {
        SourceId: sourceId,
        Amount: amount,
        Status: status,
    };

    const newPayment = new PaymentModel(paymentData);
    await newPayment.save();

    console.log(`Source ${sourceId} is chargeable. Amount: PHP ${amount}`);
};

const handlePaymentPaid = async (event) => {
    const paymentId = event.data.id;
    const status = 'Successful';

    await PaymentModel.updateOne({ PayMongoId: paymentId }, { Status: status });

    console.log(`Payment ${paymentId} was successful.`);
};

const handlePaymentFailed = async (event) => {
    const paymentId = event.data.id;
    const status = 'Failed';

    await PaymentModel.updateOne({ PayMongoId: paymentId }, { Status: status });

    console.log(`Payment ${paymentId} failed.`);
};