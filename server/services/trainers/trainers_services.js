const session = require('express-session');
const axios = require('axios')

exports.dashboard = (req, res) => {
    const { errors, isSuperAdminAuthenticated, isAnyAdminAuthenticated, isTrainerAuthenticated, user, userId } = req.session
    
    delete req.session.errors
    res.render("trainers/dashboard",{errors, isSuperAdminAuthenticated, isAnyAdminAuthenticated, isTrainerAuthenticated, user, userId},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}