const express = require('express');
const route = express.Router();
const controller = require('../../controller/payment_controller/payment_controller');

route.get("/create-order", controller.createOrder);
route.post("/webhook", express.json(), controller.handleWebhook);

module.exports = route;