const mongoose = require('mongoose');

// Define the product schema
const schema = new mongoose.Schema({
  email:{  
    type:String
  },
  otp:String,
  createdAt:Date,  
  expiresAt:Date,

});

// Create a mongoose model using the product schema
const OTP = mongoose.model('OTP',schema);

// Export the Product model
module.exports = OTP;