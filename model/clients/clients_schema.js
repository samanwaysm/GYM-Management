const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'branch',
    required: true
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  membershipType: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const client_schema = mongoose.model('client', schema);
module.exports = client_schema;
