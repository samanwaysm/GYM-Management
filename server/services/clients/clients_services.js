const session = require('express-session');

exports.home = (req, res) => {
    const { errors,userId,userType} = req.session
    
    delete req.session.errors
    res.render("clients/home",{errors,userId,userType},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.login = (req, res) => {
    const { errors,userId} = req.session
    
    delete req.session.errors
    res.render("clients/login",{errors,userId},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.user_profile = (req, res) => {
    const { errors, userId} = req.session
    
    delete req.session.errors
    res.render("clients/user_profile",{errors,userId},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.forgot_password = (req, res) => {
    const { errors, showOtp, emailOtp} = req.session
    delete req.session.errors
    delete req.session.showOtp
    delete req.session.emailOtp
    res.render("clients/forgot_password",{errors, showOtp: !!showOtp, emailOtp: emailOtp},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.change_password = (req, res) => {
    const { errors, userId} = req.session
    
    delete req.session.errors
    res.render("clients/change_password",{errors,userId},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}