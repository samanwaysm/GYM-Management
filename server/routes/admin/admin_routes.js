const express = require('express');
const route = express.Router();

const services = require('../../services/admin/admin_services');

const controller = require('../../controller/admin_controller/admin_controller');

const {isSuperAdminAuthenticated,
    isSuperAdminNotAuthenticated,
    isAdminAuthenticated,
    isAdminNotAuthenticated,
    isAnyAdminAuthenticated,
    isAnyAdminNotAuthenticated } = require('../../middleware/admin/auth');

route.get("/admin-login",isAnyAdminNotAuthenticated,services.adminLogin);
route.get("/admin-dashboard",isAnyAdminAuthenticated,services.dashboard);
route.get("/superadmin-add-admin",isSuperAdminAuthenticated,services.add_admin);
route.get("/superadmin-admin-list",isSuperAdminAuthenticated,services.admin_list);
route.get("/admin-profile",isAdminAuthenticated,services.admin_profile);
route.get("/admin-branches-list",isAnyAdminAuthenticated,services.branches_list);
route.get("/admin-add-branch",isAnyAdminAuthenticated,services.add_branch);
route.get("/admin-add-trainers",isAnyAdminAuthenticated,services.add_trainers);
route.get("/admin-trainers-list",isAnyAdminAuthenticated,services.trainers_list);
route.get("/admin-clients-list",isAnyAdminAuthenticated,services.clients_list);
route.get("/admin-add-clients",services.add_clients);


route.post("/admin/adminlogin",controller.adminLogin);
route.post("/superadmin/add-admin",controller.addAdmin);
route.post("/admin/send-otp",controller.sendAdminOTP);
route.post("/admin/verify-otp",controller.verifyAdminOTP);
route.post("/admin/add-branch",controller.addBranch);
route.post("/admin/add-trainers",controller.addTrainers);
route.post("/admin/add-clients",controller.addClients);

route.get("/admin/admin-logout",controller.adminlogout);
route.get("/admin/admin-profile",controller.getAdminProfile);

route.get("/superadmin/admin-list",controller.adminList);
route.get("/admin/branch-list",controller.branchList);
route.get("/admin/trainers-list",controller.trainersList);
route.get("/admin/clients-list",controller.clientsList);

route.get("/admin/get-branches-name",controller.getBranchNames);
route.get("/admin/get-trainers-by-branch/:branchId",controller.getTrainersByBranch);

module.exports = route;