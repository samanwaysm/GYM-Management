// USER (CLIENT)
function isUserAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect("/login"); // redirect to login if not logged in
}

function isUserNotAuthenticated(req, res, next) {
  if (req.session.userId) {
    return res.redirect("/"); // or user dashboard
  }
  next();
}

module.exports = {
  isUserAuthenticated,
  isUserNotAuthenticated
};