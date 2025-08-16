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
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Expired", "Pending"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const membership_schema = mongoose.model("membership", schema);

 module.exports = membership_schema