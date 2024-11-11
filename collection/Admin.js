const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    adminName: { type: String, required: true },

    role: { type: String, default: "Admin" },

}, {
    collection: 'admin_tb'  
});

module.exports = mongoose.model('Admin', AdminSchema);