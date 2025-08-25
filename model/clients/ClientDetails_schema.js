const mongoose = require('mongoose');

const clientDetailsSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // reference User (userType = "client")
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // reference User (userType = "trainer")
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'branch',
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
  altphone: {
    type: String
  },
  height: {
    type: Number
  },
  weight: {
    type: Number
  },
  img: {
    type: String,   // can store file path or URL
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const ClientDetails = mongoose.model('ClientDetails', clientDetailsSchema);

module.exports = ClientDetails;
