const express = require("express");
const route = express.Router();

const services = require("../../services/admin/admin_services");
const controller = require("../../controller/admin_controller/admin_controller");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  isSuperAdminAuthenticated,
  isSuperAdminNotAuthenticated,
  isAdminAuthenticated,
  isAdminNotAuthenticated,
  isAnyAdminAuthenticated,
  isAnyAdminNotAuthenticated,
  isAnyStaffAuthenticated,
  isAnyStaffNotAuthenticated,
} = require("../../middleware/admin/auth");

const gateCheck = require("../../middleware/admin/gateCheck");


// ========================
// 🔹 PAGE RENDER ROUTES (Services)
// ========================

// Auth pages
route.get("/admin-login", isAnyStaffNotAuthenticated, services.adminLogin);
route.get("/admin-forgot-password", isAnyStaffNotAuthenticated, services.forgot_password);
route.get("/admin-change-password", isAnyStaffNotAuthenticated, services.change_password);

// Dashboard & profile
route.get("/admin-dashboard", isAnyAdminAuthenticated, gateCheck(["superadmin","admin"]), services.dashboard);
route.get("/admin-profile", isAnyStaffAuthenticated, services.admin_profile);

// Superadmin pages
route.get("/superadmin-add-admin", isSuperAdminAuthenticated, gateCheck(["superadmin"]), services.add_admin);
route.get("/superadmin-edit-admin/:id", isSuperAdminAuthenticated, services.edit_admin);
route.get("/superadmin-admin-list", isSuperAdminAuthenticated, services.admin_list);

// Branch pages
route.get("/admin-branches-list", isAnyAdminAuthenticated, services.branches_list);
route.get("/admin-add-branch", isAnyAdminAuthenticated, services.add_branch);
route.get("/admin-edit-branch/:id", isAnyAdminAuthenticated, services.edit_branch);

// Trainer pages
route.get("/admin-add-trainers", isAnyAdminAuthenticated, services.add_trainers);
route.get("/admin-trainers-list", isAnyAdminAuthenticated, services.trainers_list);
route.get("/admin-edit-trainers/:id", isAnyAdminAuthenticated, services.edit_trainers);

// Client pages
route.get("/admin-clients-list", isAnyStaffAuthenticated, services.clients_list);
route.get("/admin-client-details/:id", isAnyStaffAuthenticated, services.client_details);
route.get("/admin-add-clients", isAnyStaffAuthenticated, services.add_clients);
route.get("/admin-edit-clients/:id", isAnyStaffAuthenticated, services.edit_clients);

// Package pages
route.get("/admin-package-list", isAnyAdminAuthenticated, services.package_list);

// Utility
route.get("/cam", services.cam);


// ========================
// 🔹 CONTROLLER ROUTES (APIs)
// ========================

// Auth APIs
route.post("/admin/adminlogin", controller.adminLogin);
route.post("/admin/forgot-send-otp", controller.send_otp);
route.post("/admin/forgot-verify-otp", controller.verify_OTP);
route.post("/admin/forgot-change-password", controller.change_password);
route.post("/admin/send-otp", controller.sendAdminOTP);
route.post("/admin/verify-otp", controller.verifyAdminOTP);
route.get("/admin/admin-logout", controller.adminlogout);
route.get("/admin/admin-profile", controller.getAdminProfile);

// Superadmin APIs
route.post("/superadmin/add-admin", controller.addAdmin);
route.get("/superadmin/get-admin/:id", controller.getAdminDetails);
route.put("/superadmin/update-admin/:id", controller.updateAdmin);
route.delete("/superadmin/delete-admin/:id", controller.deleteAdmin);
route.get("/superadmin/admin-list", controller.adminList);

// Branch APIs
route.post("/admin/add-branch", controller.addBranch);
route.get("/admin/get-branch/:id", controller.getBranchDetails);
route.put("/admin/update-branch/:id", controller.updateBranch);
route.delete("/admin/delete-branch/:id", controller.deleteBranch);
route.get("/admin/branch-list", controller.branchList);
route.get("/admin/get-branches-name", controller.getBranchNames);

// Trainer APIs
route.post("/admin/add-trainers", controller.addTrainers);
route.get("/admin/get-trainers/:id", controller.getTrainersDetails);
route.put("/admin/update-trainers/:id", controller.updateTrainers);
route.delete("/admin/delete-trainers/:id", controller.deleteTrainers);
route.get("/admin/trainers-list", controller.trainersList);
route.get("/admin/get-trainers-by-branch/:branchId", controller.getTrainersByBranch);

// Client APIs
route.post("/admin/add-clients", upload.single("img"), controller.addClients);
route.get("/admin/get-clients/:id", controller.getClientsDetails);
route.patch("/admin/update-client-details/:id", controller.updateClientDetails);
route.patch("/admin/update-membership/:id", controller.updateMembership);
route.delete("/admin/delete-clients/:id", controller.deleteClients);
route.get("/admin/clients-list", controller.clientsList);
route.get("/admin/get-client-details/:id", controller.getClientDetails);

// Package APIs
route.post("/admin/add-packages", controller.addPackages);
route.get("/admin/get-package-details/:id", controller.getPackageDetails);
route.put("/admin/update-package/:id", controller.updatePackage);
route.delete("/admin/delete-package/:id", controller.deletePackage);
route.get("/admin/package-list", controller.getPackageList);


module.exports = route;