const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },

    firstName: { type: String, required: true },
    middleInitial: { type: String, default: "N/A" },
    lastName: { type: String, required: true },

    isVerified: { type: Boolean, default: false},
    role: { type: String, default: "Customer" },
    bday: { type: String, required: true},
    profileImage: {
        filename: { type: String, default: '672fa43f474960c8a5765da8'}, 
        name: {type: String, default: 'Default Profile'},
        fileId: { type: String, default: '672fa43f474960c8a5765da8'},
        image: {
            data: { type: Buffer },
            contentType: { type: String }
        }
    },
    IdImage: { 
        filename: { type: String, required: true },  
        name: { type: String, required: true },      
        fileId: { type: String, required: true },    
        image: {
            data: { type: Buffer },                   
            contentType: { type: String }             
        }
    }
}, {
    collection: 'user_tb'
});

module.exports = mongoose.model('User', UserSchema);