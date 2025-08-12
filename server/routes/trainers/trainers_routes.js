const express = require('express');
const route = express.Router();

const services = require('../../services/trainers/trainers_services')

route.get("/trainer-dashboard",services.dashboard);


module.exports = route;