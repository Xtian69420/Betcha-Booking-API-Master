const mongoose = require('mongoose');

const AuditSchema = mongoose.AuditSchema({
    Reference: {type: String, required: ture},
    Date: {type: String, required: true},
    AdminId: {type: String, required: true},
    Activity: { type: String, required: true},
}, {
    collection: 'audit_tb'
});
module.exports = mongoose.model('Audit', BookingSchema);