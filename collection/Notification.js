const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now }, 
    from: { 
        fromId: {type: String, required: true},
        name: {type: String, require: true},
        fromRole: { type: String, required: true},
    },
    toId: [{
        to: { type: String, required: true },
        toRole: {type: String, required: true}
    }],
    message: { type: String, default: "" },
    isViewed: { type: Boolean, default: false},
}, {
    collection: 'notif_tb',
    timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
