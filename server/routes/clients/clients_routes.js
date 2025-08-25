const express = require('express');
const route = express.Router();

const services = require('../../services/clients/clients_services');

const controller = require('../../controller/clients_controller/client_controller');

route.get("/",services.home);
route.get("/login",services.login);
route.get("/renew-membership",services.renew_membership);

route.post("/client/login",controller.user_login);

route.get("/client/user-data-fetch/:clientId",controller.userDataFetch);

module.exports = route;