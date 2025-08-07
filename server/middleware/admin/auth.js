const express = require("express");
const session = require("express-session");

function isSuperAdminAuthenticated(req, res, next) {
  if (req.session.isSuperAdminAuthenticated === true) {
    return next();
  }
  res.redirect("/admin-login"); // or your login route
}

function isSuperAdminNotAuthenticated(req, res, next) {
  if (req.session.isSuperAdminAuthenticated === true) {
    return res.redirect("/admin-dashboard"); // or superadmin-dashboard
  }
  next();
}


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



  module.exports = {
    isSuperAdminAuthenticated,
    isSuperAdminNotAuthenticated,
    isAdminAuthenticated,
    isAdminNotAuthenticated,
    isAnyAdminAuthenticated,
    isAnyAdminNotAuthenticated
  };
  