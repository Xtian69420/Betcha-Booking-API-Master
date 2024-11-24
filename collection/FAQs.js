const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
    Date: { type: String, default: () => new Date().toISOString() },
    Question: { type: String, required: true },
    Answer: { type: String, required: true }
}, {
    collection: 'faqs_tb'
});

module.exports = mongoose.model('FAQs', FAQSchema);
