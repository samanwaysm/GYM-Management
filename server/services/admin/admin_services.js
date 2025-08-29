const session = require('express-session');
const axios = require('axios')

exports.adminLogin = (req, res) => {
    const { errors } = req.session
    delete req.session.errors
    res.render("admin/login",{errors} ,(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.forgot_password = (req, res) => {
    const { errors, showOtp, emailOtp } = req.session
    delete req.session.errors
    delete req.session.showOtp
    res.render("admin/forgot_password",{errors, showOtp: !!showOtp, emailOtp: emailOtp } ,(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.change_password = (req, res) => {
    const { errors, showOtp } = req.session
    delete req.session.errors
    delete req.session.showOtp
    res.render("admin/change_password",{errors} ,(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.dashboard = (req, res) => {
    const { errors, isSuperAdminAuthenticated, isAnyAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/dashboard",{errors, isSuperAdminAuthenticated, isAnyAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.add_admin = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/add_admin",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.edit_admin = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/edit_admin",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.admin_list = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/admin_list",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.admin_profile = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/admin_profile",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.branches_list = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/branches_list",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}


exports.add_branch = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/add_branch",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.edit_branch = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/edit_branch",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.trainers_list = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/trainers_list",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.add_trainers=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, user,userId, userType } = req.session
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/admin/get-branches-name`)
    .then(function (response){
        console.log(response.data);
        res.render("admin/add_trainers",{branches: response.data,errors, isSuperAdminAuthenticated,user,userId, userType});
    })
    .catch(err => {
        res.send(err);
    });
}

exports.edit_trainers = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/edit_trainers",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.clients_list = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/clients_list",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.client_details = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/client_details",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.add_clients = (req, res) => {
    const { errors, isSuperAdminAuthenticated, isAnyAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/add_clients",{errors, isSuperAdminAuthenticated, isAnyAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.edit_clients = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/edit_clients",{errors, isSuperAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.package_list = (req, res) => {
    const { errors, isSuperAdminAuthenticated, isAnyAdminAuthenticated, user, userId, userType } = req.session
    delete req.session.errors
    res.render("admin/package_list",{errors, isSuperAdminAuthenticated, isAnyAdminAuthenticated, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}


exports.cam = (req, res) => {
    const { errors } = req.session
    delete req.session.errors
    res.render("admin/cam",{errors} ,(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}