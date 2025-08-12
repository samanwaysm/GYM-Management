

function gateCheck(allowedRoles = []) {
  return function (req, res, next) {
    const isSuperAdmin = req.session.isSuperAdminAuthenticated;
    const isAdmin = req.session.isAdminAuthenticated;

    // SuperAdmin
    if (allowedRoles.includes('superadmin') && isSuperAdmin) {
      return next();
    }

    // Admin
    if (allowedRoles.includes('admin') && isAdmin) {
      return next();
    }

    // Access Denied
    return res.status(403).render("403", { message: "Access Denied" }); // optional: custom 403 page
  };
}

module.exports = gateCheck;
