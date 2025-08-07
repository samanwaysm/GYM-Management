const mongoose = require('mongoose');

var schema = new mongoose.Schema({
    username:{
        type: String,
        required:true
    },
    email:{
        type: String,
        required:true,
        unique:true
    },
    phone:{
        type: String,
        required:true
    },
    password:{
        type: String,
        required:true
    }
})

const admin_schema = mongoose.model('admin', schema);

module.exports = admin_schema;