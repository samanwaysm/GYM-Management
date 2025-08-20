const Client = require("../../../model/clients/clients_schema")

const Membership = require("../../../model/clients/membership_schema")

const Razorpay = require("razorpay");
const instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

