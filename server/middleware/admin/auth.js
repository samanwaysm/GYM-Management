const express = require("express");
const session = require("express-session");

// SUPER ADMIN
function isSuperAdminAuthenticated(req, res, next) {
  if (req.session.isSuperAdminAuthenticated === true) {
    return next();
  }
  res.redirect("/admin-login");
}

function isSuperAdminNotAuthenticated(req, res, next) {
  if (req.session.isSuperAdminAuthenticated === true) {
    return res.redirect("/admin-dashboard");
  }
  next();
}

// ADMIN
function isAdminAuthenticated(req, res, next) {
  if (req.session.isAdminAuthenticated === true) {
    return next();
  }
  res.redirect("/admin-login");
}

function isAdminNotAuthenticated(req, res, next) {
  if (req.session.isAdminAuthenticated === true) {
    return res.redirect("/admin-dashboard");
  }
  next();
}

// TRAINER
function isTrainerAuthenticated(req, res, next) {
  if (req.session.isTrainerAuthenticated === true) {
    return next();
  }
  res.redirect("/trainer-login");
}

function isTrainerNotAuthenticated(req, res, next) {
  if (req.session.isTrainerAuthenticated === true) {
    return res.redirect("/trainer-dashboard");
  }
  next();
}

// ANY ADMIN (SUPER ADMIN or ADMIN)
function isAnyAdminAuthenticated(req, res, next) {
  if (req.session.isSuperAdminAuthenticated || req.session.isAdminAuthenticated) {
    return next();
  }
  res.redirect('/admin-login');
}

function isAnyAdminNotAuthenticated(req, res, next) {
  if (req.session.isAdminAuthenticated || req.session.isSuperAdminAuthenticated) {
    return res.redirect('/admin-dashboard');
  }
  next();
}

// ANY STAFF (SUPER ADMIN, ADMIN, TRAINER)
function isAnyStaffAuthenticated(req, res, next) {
  if (
    req.session.isSuperAdminAuthenticated ||
    req.session.isAdminAuthenticated ||
    req.session.isTrainerAuthenticated
  ) {
    return next();
  }
  res.redirect('/admin-login'); // or a general login page
}

function isAnyStaffNotAuthenticated(req, res, next) {
  if (
    req.session.isSuperAdminAuthenticated ||
    req.session.isAdminAuthenticated ||
    req.session.isTrainerAuthenticated
  ) {
    return res.redirect('/admin-dashboard'); // or a shared dashboard
  }
  next();
}

module.exports = {
  isSuperAdminAuthenticated,
  isSuperAdminNotAuthenticated,
  isAdminAuthenticated,
  isAdminNotAuthenticated,
  isTrainerAuthenticated,
  isTrainerNotAuthenticated,
  isAnyAdminAuthenticated,
  isAnyAdminNotAuthenticated,
  isAnyStaffAuthenticated,
  isAnyStaffNotAuthenticated
};
