const session = require('express-session');
const axios = require('axios')

exports.dashboard = (req, res) => {
    const { errors, user, userId, userType } = req.session
    
    delete req.session.errors
    res.render("trainers/dashboard",{errors, user, userId, userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}