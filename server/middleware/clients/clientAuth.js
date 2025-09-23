
// ✅ Middleware to check if user is logged in and is a client
function isUserAuthenticated(req, res, next) {
  if (req.session.userId && req.session.user && req.session.userType === "client") {
    return next();
  }

  // If not logged in or not a client, redirect to login
  req.session.errors = { auth: "Please log in as a client to access this page." };
  return res.redirect("/login");
}

// ✅ Middleware to check if user is NOT logged in
function isUserNotAuthenticated(req, res, next) {
  if (req.session.userId && req.session.user && req.session.userType === "client") {
    // Already logged in → redirect to dashboard/home
    return res.redirect("/user-dashboard"); 
  }
  next();
}

module.exports = {
  isUserAuthenticated,
  isUserNotAuthenticated
};
