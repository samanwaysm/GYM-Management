const express = require('express');
const route = express.Router();
const controller = require('../../controller/payment_controller/payment_controller');

route.post("/payment/webhook", express.json(), controller.handleWebhook);
route.get("/payment/create-order", controller.createOrder);

route.post("/client/update-membership",controller.updateMembership);
route.post("/client/verify-payment",controller.verifyPayment);

module.exports = route;