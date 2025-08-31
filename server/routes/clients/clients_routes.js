const express = require('express');
const route = express.Router();

const services = require('../../services/clients/clients_services');

const controller = require('../../controller/clients_controller/client_controller');

const {
  isUserAuthenticated,
  isUserNotAuthenticated
} = require("../../middleware/clients/authClient");

route.get("/",services.home);
route.get("/login",isUserNotAuthenticated,services.login);
route.get("/user-profile",isUserAuthenticated,services.user_profile);
route.get("/forgot-password",isUserNotAuthenticated,services.forgot_password);
route.get("/change-password",isUserNotAuthenticated,services.change_password);

route.post("/client/login",controller.user_login);
route.get("/client/user-data-fetch/:clientId",controller.userDataFetch);

module.exports = route;