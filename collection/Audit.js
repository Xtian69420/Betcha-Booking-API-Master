const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
    Reference: { type: Number, required: true },
    Date: { type: String, required: true },
    UserId: { type: String, required: true },
    Username: { type: String, required: true },
    Activity: { type: String, required: true },
    Role: { type: String, required: true }
}, {
    collection: 'audit_tb'
});

module.exports = mongoose.model('Audit', AuditSchema);
