const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },

    firstName: { type: String, required: true },
    middleInitial: { type: String, default: "N/A" },
    lastName: { type: String, required: true },

    isVerified: { type: Boolean, default: false},
    role: { type: String, default: "User" },
    //profilImage
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