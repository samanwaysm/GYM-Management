const express = require('express');
const route = express.Router();
const controller = require('../../controller/payment_controller/payment_controller');

route.get("/payment/create-order", controller.createOrder);
route.post("/payment/webhook", express.json(), controller.handleWebhook);

module.exports = route;