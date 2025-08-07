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



exports.dashboard = (req, res) => {
    const { errors, isSuperAdminAuthenticated, adminName, adminId } = req.session
    delete req.session.errors
    res.render("admin/dashboard",{errors, isSuperAdminAuthenticated, adminName, adminId},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.add_admin = (req, res) => {
    const { errors, isSuperAdminAuthenticated, adminName, adminId } = req.session
    delete req.session.errors
    res.render("admin/add_admin",{errors, isSuperAdminAuthenticated, adminName, adminId},(err, html) => {
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
    const { errors, isSuperAdminAuthenticated, adminName, adminId } = req.session
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/superadmin/admin-list`)
    .then(function (response){
        res.render("admin/admin_list",{admins: response.data,errors, isSuperAdminAuthenticated,adminName,adminId});
    })
    .catch(err => {
        res.send(err);
    });
}

exports.admin_profile=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, adminName,adminId } = req.session
    console.log(adminId);
    
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/admin/admin-profile`,{params: { adminId }})
    .then(function (response){
        console.log(response.data);
        res.render("admin/admin_profile",{admin: response.data,errors, isSuperAdminAuthenticated,adminName,adminId});
    })
    .catch(err => {
        res.send(err);
    });
}

exports.branches_list=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, adminName,adminId } = req.session
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/admin/branch-list`,{params: { adminId }})
    .then(function (response){
        console.log(response.data);
        res.render("admin/branches_list",{branches: response.data,errors, isSuperAdminAuthenticated,adminName,adminId});
    })
    .catch(err => {
        res.send(err);
    });
}

exports.add_branch = (req, res) => {
    const { errors, isSuperAdminAuthenticated, adminName, adminId } = req.session
    delete req.session.errors
    res.render("admin/add_branch",{errors, isSuperAdminAuthenticated, adminName, adminId},(err, html) => {
        if (err) {
            console.log(err);
        }
        res.send(html)
    })
}

exports.trainers_list=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, adminName,adminId } = req.session
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/admin/trainers-list`)
    .then(function (response){
        console.log(response.data);
        res.render("admin/trainers_list",{trainers: response.data,errors, isSuperAdminAuthenticated,adminName,adminId});
    })
    .catch(err => {
        res.send(err);
    });
}

exports.add_trainers=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, adminName,adminId } = req.session
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/admin/get-branches-name`)
    .then(function (response){
        console.log(response.data);
        res.render("admin/add_trainers",{branches: response.data,errors, isSuperAdminAuthenticated,adminName,adminId});
    })
    .catch(err => {
        res.send(err);
    });
}

exports.clients_list=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, adminName,adminId } = req.session
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/admin/clients-list`)
    .then(function (response){
        console.log(response.data);
        res.render("admin/clients_list",{admin: response.data,errors, isSuperAdminAuthenticated,adminName,adminId});
    })
    .catch(err => {
        res.send(err);
    });
}

// exports.add_clients=(req,res)=>{
//     const { errors, isSuperAdminAuthenticated, adminName, adminId } = req.session;
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
//             adminName,
//             adminId
//         });
//     }))
//     .catch(err => {
//         console.error("Error in add_clients controller:", err);
//         res.send("Something went wrong while fetching branches or trainers.");
//     });
// }

exports.add_clients=(req,res)=>{
    const { errors, isSuperAdminAuthenticated, adminName,adminId } = req.session
    delete req.session.errors
    axios.get(`http://localhost:${process.env.PORT}/admin/get-branches-name`)
    .then(function (response){
        console.log(response.data);
        res.render("admin/add_clients",{branches: response.data,errors, isSuperAdminAuthenticated,adminName,adminId});
    })
    .catch(err => {
        res.send(err);
    });
}