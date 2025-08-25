const mongoose = require('mongoose');

const trainerDetailsSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',   // reference User collection (userType = "trainer")
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'branch', // reference your branch collection
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true }); // adds createdAt & updatedAt automatically

const TrainerDetails = mongoose.model('TrainerDetails', trainerDetailsSchema);

module.exports = TrainerDetails;
