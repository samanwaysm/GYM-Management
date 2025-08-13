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
    const { errors, isSuperAdminAuthenticated, isAnyAdminAuthenticated, user, userId } = req.session
    delete req.session.errors
    res.render("admin/dashboard",{errors, isSuperAdminAuthenticated, isAnyAdminAuthenticated, user, userId},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.add_admin = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId } = req.session
    delete req.session.errors
    res.render("admin/add_admin",{errors, isSuperAdminAuthenticated, user, userId},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

// exports.admin_list = (req, res) => {
//     res.render("admin/admin_list",(err, html) => {
//         if (err) {
//             console.log(err);
//         }
//         res.send(html)
//     })
// }

exports.admin_list=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, user, userId } = req.session
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/superadmin/admin-list`)
    .then(function (response){
        res.render("admin/admin_list",{admins: response.data,errors, isSuperAdminAuthenticated,user,userId});
    })
    .catch(err => {
        res.send(err);
    });
}

exports.admin_profile=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, user,userId } = req.session
    console.log(userId);
    
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/admin/admin-profile`,{params: { userId }})
    .then(function (response){
        console.log(response.data);
        res.render("admin/admin_profile",{admin: response.data,errors, isSuperAdminAuthenticated,user,userId});
    })
    .catch(err => {
        res.send(err);
    });
}

// exports.branches_list=(req,res)=>{
//     const { errors, isSuperAdminAuthenticated, user,userId } = req.session
//     delete req.session.errors
//     axios.get(`http://localhost:${process.env.PORT}/admin/branch-list`,{params: { userId }})
//     .then(function (response){
//         console.log(response.data);
//         res.render("admin/branches_list",{branches: response.data,errors, isSuperAdminAuthenticated,user,userId});
//     })
//     .catch(err => {
//         res.send(err);
//     });
// }

exports.branches_list = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId } = req.session;
    delete req.session.errors;

    const page = req.query.page || 1; // get page from query params

    axios.get(`http://localhost:${process.env.PORT}/admin/branch-list?page=${page}`, {
        params: { userId }
    })
    .then(function (response) {
        const { branches, totalPages, currentPage } = response.data;
        res.render("admin/branches_list", {
            branches,
            totalPages,
            currentPage,
            errors,
            isSuperAdminAuthenticated,
            user,
            userId
        });
    })
    .catch(err => {
        res.send(err);
    });
};


exports.add_branch = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId } = req.session
    delete req.session.errors
    res.render("admin/add_branch",{errors, isSuperAdminAuthenticated, user, userId},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

// exports.trainers_list=(req,res)=>{
//     const { errors, isSuperAdminAuthenticated, user,userId } = req.session
//     delete req.session.errors
//     axios.get(`http://localhost:${process.env.PORT}/admin/trainers-list`)
//     .then(function (response){
//         console.log(response.data);
//         res.render("admin/trainers_list",{trainers: response.data,errors, isSuperAdminAuthenticated,user,userId});
//     })
//     .catch(err => {
//         res.send(err);
//     });
// }

exports.trainers_list = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId } = req.session;
    delete req.session.errors;

    const page = req.query.page || 1;

    axios.get(`http://localhost:${process.env.PORT}/admin/trainers-list?page=${page}`)
        .then(function (response) {
            const { trainers, totalPages, currentPage } = response.data;
            res.render("admin/trainers_list", {
                trainers,
                totalPages,
                currentPage,
                errors,
                isSuperAdminAuthenticated,
                user,
                userId
            });
        })
        .catch(err => {
            res.send(err);
        });
};


exports.add_trainers=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, user,userId } = req.session
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/admin/get-branches-name`)
    .then(function (response){
        console.log(response.data);
        res.render("admin/add_trainers",{branches: response.data,errors, isSuperAdminAuthenticated,user,userId});
    })
    .catch(err => {
        res.send(err);
    });
}

exports.clients_list = (req, res) => {
    const { errors, isSuperAdminAuthenticated, user, userId } = req.session;
    delete req.session.errors;

    const page = req.query.page || 1; // get page from URL query

    axios.get(`http://localhost:${process.env.PORT}/admin/clients-list?page=${page}`)
        .then(function (response) {
            const { clients, totalPages, currentPage } = response.data;
            res.render("admin/clients_list", {
                clients,
                totalPages,
                currentPage,
                errors,
                isSuperAdminAuthenticated,
                user,
                userId
            });
        })
        .catch(err => {
            res.send(err);
        });
};


// exports.clients_list=(req,res)=>{
//     const { errors, isSuperAdminAuthenticated, user,userId } = req.session
//     delete req.session.errors
//     axios.get(`http://localhost:${process.env.PORT}/admin/clients-list`)
//     .then(function (response){
//         console.log(response.data);
//         res.render("admin/clients_list",{clients: response.data,errors, isSuperAdminAuthenticated,user,userId});
//     })
//     .catch(err => {
//         res.send(err);
//     });
// }


// exports.add_clients=(req,res)=>{
//     const { errors, isSuperAdminAuthenticated, user, userId } = req.session;
//     delete req.session.errors;

//     axios.all([
//         axios.get(`http://localhost:${process.env.PORT}/admin/get-branches-name`),
//         axios.get(`http://localhost:${process.env.PORT}/admin/get-trainers-name`)
//     ])
//     .then(axios.spread((branchesRes, trainersRes) => {
//         res.render("admin/add_clients", {
//             branches: branchesRes.data,
//             trainers: trainersRes.data,
//             errors,
//             isSuperAdminAuthenticated,
//             user,
//             userId
//         });
//     }))
//     .catch(err => {
//         console.error("Error in add_clients controller:", err);
//         res.send("Something went wrong while fetching branches or trainers.");
//     });
// }

exports.add_clients=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, user,userId } = req.session
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/admin/get-branches-name`)
    .then(function (response){
        console.log(response.data);
        res.render("admin/add_clients",{branches: response.data,errors, isSuperAdminAuthenticated,user,userId});
    })
    .catch(err => {
        res.send(err);
    });
}