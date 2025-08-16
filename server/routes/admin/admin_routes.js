const express = require('express');
const route = express.Router();

const services = require('../../services/admin/admin_services');

const controller = require('../../controller/admin_controller/admin_controller');

const {isSuperAdminAuthenticated,
    isSuperAdminNotAuthenticated,
    isAdminAuthenticated,
    isAdminNotAuthenticated,
    isAnyAdminAuthenticated,
    isAnyAdminNotAuthenticated,
    isAnyStaffAuthenticated,
    isAnyStaffNotAuthenticated } = require('../../middleware/admin/auth');

const gateCheck = require('../../middleware/admin/gateCheck')

route.get("/admin-login",isAnyStaffNotAuthenticated,services.adminLogin);
route.get("/admin-dashboard",isAnyAdminAuthenticated,gateCheck(['superadmin','admin']),services.dashboard);
route.get("/superadmin-add-admin",isSuperAdminAuthenticated,gateCheck(['superadmin']),services.add_admin);
route.get("/superadmin-admin-list",isSuperAdminAuthenticated,services.admin_list);
route.get("/admin-profile",isAnyStaffAuthenticated,services.admin_profile);
route.get("/admin-branches-list",isAnyAdminAuthenticated,services.branches_list);
route.get("/admin-add-branch",isAnyAdminAuthenticated,services.add_branch);
route.get("/admin-add-trainers",isAnyAdminAuthenticated,services.add_trainers);
route.get("/admin-trainers-list",isAnyAdminAuthenticated,services.trainers_list);
route.get("/admin-clients-list",isAnyStaffAuthenticated,services.clients_list);
route.get("/admin-add-clients",isAnyStaffAuthenticated,services.add_clients);
route.get("/admin-forgot-password",isAnyStaffNotAuthenticated,services.forgot_password)
route.get("/admin-change-password",isAnyStaffNotAuthenticated,services.change_password)
route.get("/admin-package-list",isAnyAdminAuthenticated,services.package_list)


route.post("/admin/adminlogin",controller.adminLogin);
route.post("/admin/forgot-send-otp",controller.send_otp);
route.post("/admin/forgot-verify-otp/:email",controller.verify_OTP);
route.post("/admin/forgot-change-password",controller.change_password);
route.post("/superadmin/add-admin",controller.addAdmin);
route.post("/admin/send-otp",controller.sendAdminOTP);
route.post("/admin/verify-otp",controller.verifyAdminOTP);
route.post("/admin/add-branch",controller.addBranch);
route.post("/admin/add-trainers",controller.addTrainers);
route.post("/admin/add-clients",controller.addClients);
route.post("/admin/add-packages",controller.addPackages);

route.get("/admin/admin-logout",controller.adminlogout);
route.get("/admin/admin-profile",controller.getAdminProfile);
route.get("/admin/package-list",controller.getPackageList);

route.get("/superadmin/admin-list",controller.adminList);
route.get("/admin/branch-list",controller.branchList);
route.get("/admin/trainers-list",controller.trainersList);
route.get("/admin/clients-list",controller.clientsList);

route.get("/admin/get-branches-name",controller.getBranchNames);
route.get("/admin/get-trainers-by-branch/:branchId",controller.getTrainersByBranch);

module.exports = route;