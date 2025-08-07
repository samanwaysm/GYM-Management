const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // e.g., "Kannur Branch"
  },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    pincode: { type: String },
    geo: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  phone: { 
    type: String  
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const branch_schema = mongoose.model('branch', schema);

module.exports = branch_schema;
