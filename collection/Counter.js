const mongoose = require('mongoose');

const CounterSchema = mongoose.Schema({
    collectionName: { type: String, required: true },
    sequenceValue: { type: Number, default: 1 }
});

module.exports = mongoose.model('Counter', CounterSchema);