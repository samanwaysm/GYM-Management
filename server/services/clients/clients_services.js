const session = require('express-session');

exports.home = (req, res) => {
    const { errors,userId} = req.session
    
    delete req.session.errors
    res.render("clients/home",{errors,userId},(err, html) => {
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

exports.renew_membership = (req, res) => {
    const { errors, userId} = req.session
    
    delete req.session.errors
    res.render("clients/renew_membership",{errors,userId},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}