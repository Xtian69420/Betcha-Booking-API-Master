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
        const linkResponse = await fetch(`https://api.paymongo.com/v1/links/${linkId}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(payMongoApiKey + ':').toString('base64'),
            },
        });

        const linkDetails = await linkResponse.json();

        if (linkDetails.data && linkDetails.data.attributes.payments.length > 0) {
            const paymentId = linkDetails.data.attributes.payments[0].data.id;

            const paymentDetails = await fetchPaymentDetails(paymentId);

            if (paymentDetails.data) {
                const status = paymentDetails.data.attributes.status;
                const mop = paymentDetails.data.attributes.source.type; 

                const updatedPayment = await PaymentModel.findOneAndUpdate(
                    { PayMongoId: linkId },  
                    { 
                        $set: { 
                            Status: status === 'paid' ? 'Successful' : 'Failed', 
                            Mop: mop, 
                            PaymentId: paymentId, 
                        }
                    },
                    { new: true }
                );

                if (updatedPayment) {
                    res.status(200).json({
                        message: 'Payment details retrieved and updated successfully.',
                        paymentDetails: updatedPayment,
                    });
                } else {
                    res.status(404).json({ error: 'Payment document not found in the database.' });
                }
            } else {
                res.status(404).json({ error: 'Payment details not found' });
            }
        } else {
            res.status(400).json({  });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch payment details' });
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
