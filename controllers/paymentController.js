const PaymentModel = require('../collection/Payment');
const fetch = require('node-fetch');

const payMongoApiUrl = 'https://api.paymongo.com/v1/links';
const payMongoApiKey = 'sk_test_FY8RJmTrGqyv1peKyRq31rh2';

// Helper function to generate payment link
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

// Get All Payments
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await PaymentModel.find({});
        res.status(200).json({ payments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
};

// Get Payments by User
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

// Get Payments by Unit
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
        
        // Validate the signature
        const hmac = crypto.createHmac('sha256', payMongoApiKey);
        hmac.update(payload);
        const expectedSig = hmac.digest('hex');

        if (sig !== expectedSig) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        const event = req.body.data;
        const eventType = event.type;

        // Handle different event types
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

        // Respond to PayMongo to acknowledge receipt
        return res.status(200).send('Webhook received successfully');
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Handle a chargeable source event (when the source is ready to be charged)
const handleSourceChargeable = async (event) => {
    const sourceId = event.data.id;
    const amount = event.data.attributes.amount / 100; // Convert amount from cents to PHP
    const status = 'Chargeable';

    // Optionally, save the source and amount in the database
    const paymentData = {
        SourceId: sourceId,
        Amount: amount,
        Status: status,
    };

    const newPayment = new PaymentModel(paymentData);
    await newPayment.save();

    console.log(`Source ${sourceId} is chargeable. Amount: PHP ${amount}`);
};

// Handle a successful payment event
const handlePaymentPaid = async (event) => {
    const paymentId = event.data.id;
    const status = 'Successful';

    // Update the payment status in your database
    await PaymentModel.updateOne({ PayMongoId: paymentId }, { Status: status });

    console.log(`Payment ${paymentId} was successful.`);
};

// Handle a failed payment event
const handlePaymentFailed = async (event) => {
    const paymentId = event.data.id;
    const status = 'Failed';

    // Update the payment status in your database
    await PaymentModel.updateOne({ PayMongoId: paymentId }, { Status: status });

    console.log(`Payment ${paymentId} failed.`);
};