// models/packageDb.js
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    packageType: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
}, { timestamps: true });

const package_schema = mongoose.model("package", schema);

module.exports = package_schema
