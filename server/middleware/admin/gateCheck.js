function gateCheck(allowedRoles = []) {
  return function (req, res, next) {
    const isSuperAdmin = req.session.isSuperAdminAuthenticated;
    const isAdmin = req.session.isAdminAuthenticated;
    const isTrainer = req.session.isTrainerAuthenticated;

    // SuperAdmin
    if (allowedRoles.includes("superadmin") && isSuperAdmin) {
      return next();
    }

    // Admin
    if (allowedRoles.includes("admin") && isAdmin) {
      return next();
    }

    // Trainer
    if (allowedRoles.includes("trainer") && isTrainer) {
      return next();
    }

    // ❌ Access Denied → redirect based on logged-in role
    if (isSuperAdmin) {
      return res.redirect("/admin-dashboard"); 
    }
    if (isAdmin) {
      return res.redirect("/admin-dashboard"); 
    }
    if (isTrainer) {
      return res.redirect("/trainer-dashboard"); 
    }

    // If not logged in at all → send to login
    return res.redirect("/admin-login"); 
  };
}

module.exports = gateCheck;
