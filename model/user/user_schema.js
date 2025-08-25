const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        enum: ["admin", "trainer", "client"], // restrict values
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true }); // adds createdAt & updatedAt automatically

const user_schema = mongoose.model('User', schema);

module.exports = user_schema;
