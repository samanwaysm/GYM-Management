const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "client", // Reference to Client
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "package", // Reference to Package
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash","UPI",],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    confirmedPayment: {
      type: Boolean,
      default: false,
    },
    paidDate: {
      type: Date,
      default: Date.now,
    },
    expiredDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Expired"],
    },
  },
  { timestamps: true }
);

const membership_schema = mongoose.model("membership", schema);

 module.exports = membership_schema