const mongoose = require('mongoose');

const ToSchema = new mongoose.Schema({
    To: {type: String}
});

const NotificationSchema = new mongoose.Schema({
    Date: {type: String, required: true},
    From: {type: String, required: true},
    To: [ToSchema],
    Message: {type: String, default: ""},
    isViewed: {type: Boolean, default: false, set: v => v === 'TRUE'}
},{
    collection: 'notif_tb'
})

module.exports = mongoose.model('Notification', NotificationSchema);