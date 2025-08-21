const session = require('express-session');

exports.home = (req, res) => {
    const { errors,} = req.session
    
    delete req.session.errors
    res.render("clients/home",{errors},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.login = (req, res) => {
    const { errors,} = req.session
    
    delete req.session.errors
    res.render("clients/login",{errors},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}