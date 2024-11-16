const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now }, 
    fromId: { type: String, required: true },
    toId: [{
        to: { type: String, required: true }
    }],
    message: { type: String, default: "" },
    isViewed: { 
        type: Boolean, 
        default: false, 
        set: v => v === 'TRUE' || v === true 
    }
}, {
    collection: 'notif_tb',
    timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
