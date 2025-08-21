const express = require('express');
const route = express.Router();

const services = require('../../services/clients/clients_services');

route.get("/",services.home);
route.get("/login",services.login);

module.exports = route;