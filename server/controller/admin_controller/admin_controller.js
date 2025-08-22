const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const twilio = require("twilio");
const Razorpay = require("razorpay");

const Admin = require("../../../model/admin/admin_schema");
const OtpDb = require("../../../model/admin/otp_schema")
const Branch = require("../../../model/admin/branch_schema");
const Package = require("../../../model/admin/package_schema")

const Trainer = require("../../../model/trainers/trainers_schema");
const Client = require("../../../model/clients/clients_schema")

const Membership = require("../../../model/clients/membership_schema")


const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// exports.adminLogin = async (req, res) => {
//   const superAdmin = {
//     email: process.env.ADMIN_EMAIL,
//     password: process.env.ADMIN_PASS,
//   };

//   const { email, password } = req.body;
//   const errors = {};

//   // Required fields
//   if (!email) errors.email = "Email is required.";
//   if (!password) errors.password = "Password is required.";

//   if (Object.keys(errors).length > 0) {
//     req.session.errors = errors;
//     return res.redirect("/admin-login");
//   }

//   // Email format validation
//   const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailPattern.test(email)) {
//     req.session.errors = { email: "Invalid email format." };
//     return res.redirect("/admin-login");
//   }

//   try {
//     // Check for SuperAdmin login
//     if (email === superAdmin.email) {
//       if (password === superAdmin.password) {
//         req.session.isSuperAdminAuthenticated = true;
//         req.session.isAnyAdminAuthenticated = true;
//         req.session.user = 'superAdmin'
//         return res.redirect("/admin-dashboard"); // Or "/superadmin-dashboard"
//       } else {
//         req.session.errors = { password: "Incorrect SuperAdmin password." };
//         return res.redirect("/admin-login");
//       }
//     }

//     // Check for normal Admin in DB
//     const admin = await Admin.findOne({ email });
//     if (!admin) {
//       req.session.errors = { email: "Admin not found." };
//       return res.redirect("/admin-login");
//     }

//     // Compare password (if hashed)
//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//       req.session.errors = { password: "Incorrect password." };
//       return res.redirect("/admin-login");
//     }

//     // Authenticated as Admin
//     req.session.isAdminAuthenticated = true;
//     req.session.isAnyAdminAuthenticated = true;
//     req.session.adminId = admin._id;
//     req.session.adminName = admin.username;
//     return res.redirect("/admin-dashboard");
//   } catch (err) {
//     console.error(err);
//     req.session.errors = { loginError: "Something went wrong during login." };
//     return res.redirect("/admin-login");
//   }
// };


exports.adminLogin = async (req, res) => {
  const superAdmin = {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASS,
  };

  const { email, password } = req.body;
  const errors = {};

  // Required fields
  if (!email) errors.email = "Email is required.";
  if (!password) errors.password = "Password is required.";

  if (Object.keys(errors).length > 0) {
    req.session.errors = errors;
    return res.redirect("/admin-login");
  }

  // Email format validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    req.session.errors = { email: "Invalid email format." };
    return res.redirect("/admin-login");
  }

  try {
    // 1️⃣ Check for SuperAdmin login
    if (email === superAdmin.email) {
      if (password === superAdmin.password) {
        req.session.isSuperAdminAuthenticated = true;
        req.session.isAnyAdminAuthenticated = true;
        req.session.user = 'superAdmin';
        return res.redirect("/admin-dashboard");
      } else {
        req.session.errors = { password: "Incorrect SuperAdmin password." };
        return res.redirect("/admin-login");
      }
    }

    // 2️⃣ Check for normal Admin
    const admin = await Admin.findOne({ email });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        req.session.errors = { password: "Incorrect password." };
        return res.redirect("/admin-login");
      }
      req.session.isAdminAuthenticated = true;
      req.session.isAnyAdminAuthenticated = true;
      req.session.userId = admin._id;
      req.session.user = admin.name;
      return res.redirect("/admin-dashboard");
    }

    // 3️⃣ Check for Trainer
    const trainer = await Trainer.findOne({ email });
    if (trainer) {
      const isMatch = await bcrypt.compare(password, trainer.password);
      if (!isMatch) {
        req.session.errors = { password: "Incorrect password." };
        return res.redirect("/admin-login");
      }
      req.session.isTrainerAuthenticated = true;
      req.session.userId = trainer._id;
      req.session.user = trainer.name;
      console.log(req.session);

      return res.redirect("/trainer-dashboard");
    }

    // ❌ If no match found
    req.session.errors = { email: "No account found with this email." };
    return res.redirect("/admin-login");

  } catch (err) {
    console.error(err);
    req.session.errors = { loginError: "Something went wrong during login." };
    return res.redirect("/admin-login");
  }
};

exports.adminlogout = (req, res) => {
  // Clear session variables
  req.session.isAdminAuthenticated = false;
  req.session.isSuperAdminAuthenticated = false;
  req.session.isAnyAdminAuthenticated = false;
  req.session.adminId = null;
  req.session.adminName = null;

  // Optionally destroy the entire session
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/admin-dashboard"); // fallback
    }

    // Redirect to login page after logout
    res.redirect("/admin-login");
  });
};

exports.send_otp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.session.errors = { email: "Email is required" };
      return res.redirect("/admin-forgot-password");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save email in session
    req.session.email = email;

    // Delete any existing OTPs for this email
    await OtpDb.deleteMany({ email });

    // Save new OTP to DB with 60s expiry
    const newOtp = new OtpDb({
      email,
      otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * 1000 // 60 seconds
    });

    await newOtp.save();

    // Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

    // Mailgen config
    const mailGenerator = new Mailgen({
      theme: 'default',
      product: {
        name: 'Gym Management App',
        link: 'https://yourdomain.com/',
      },
    });

    // Mail content
    const emailTemplate = {
      body: {
        name: 'User',
        intro: `Your OTP code is: **${otp}**`,
        outro: 'This OTP is valid for 60 seconds. If you didn’t request this, ignore the email.',
      },
    };

    const mailBody = mailGenerator.generate(emailTemplate);

    const message = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: 'OTP Verification Code',
      html: mailBody,
    };

    await transporter.sendMail(message);

    // ✅ Show OTP input in the next render
    req.session.showOtp = true;
    req.session.emailOtp = req.session.email;
    console.log(req.session.emailOtp);

    return res.redirect("/admin-forgot-password");

  } catch (error) {
    console.error("OTP send error:", error);
    req.session.errors = { general: "Failed to send OTP" };
    return res.redirect("/admin-forgot-password");
  }
}

exports.verify_OTP = async (req, res) => {
  const { otp } = req.body;
  const { email } = req.params;
  console.log(req.body);
  console.log(req.params);


  try {
    const otpRecord = await OtpDb.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      req.session.errors = { otp: "OTP not found." };
      req.session.showOtp = true;
      return res.redirect("/admin-forgot-password");
    }

    if (Date.now() > otpRecord.expiresAt) {
      await OtpDb.deleteOne({ _id: otpRecord._id });
      req.session.errors = { otp: "OTP expired." };
      req.session.showOtp = true;
      return res.redirect("/admin-forgot-password");
    }

    if (otpRecord.otp.toString() !== otp.join("")) {
      req.session.errors = { otp: "Invalid OTP." };
      req.session.showOtp = true;
      return res.redirect("/admin-forgot-password");
    }

    // OTP is valid → clear OTP and go to change password page
    await OtpDb.deleteOne({ _id: otpRecord._id });

    req.session.resetEmail = email; // store email for next step
    return res.redirect("/admin-change-password");

  } catch (err) {
    console.error(err);
    req.session.errors = { otp: "Server error." };
    req.session.showOtp = true;
    return res.redirect("/admin-forgot-password");
  }
};
exports.change_password = async (req, res) => {
  const { new_password, confirm_password } = req.body;
  const email = req.session?.resetEmail; // ✅ Get email from session
  const errors = {};

  try {
    // ✅ Session email check
    if (!email) {
      return res.json({ success: false, message: "Session expired. Please log in again." });
    }

    // ✅ Password match check
    if (!new_password || !confirm_password) {
      errors.password = "Both password fields are required.";
    } else if (new_password !== confirm_password) {
      errors.password = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      return res.json({ success: false, errors });
    }

    // ✅ Search in Admin or Trainer collections
    let user = await Admin.findOne({ email });
    if (!user) {
      user = await Trainer.findOne({ email });
    }

    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    // ✅ Hash and save password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    user.password = hashedPassword;
    await user.save();

    // Optional: Flash success message
    req.session.success = `password updated successfully.`;

    // Redirect to admin login
    return res.redirect("/admin-login");

  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error." });
  }
}

exports.addAdmin = async (req, res) => {
  const { name, email, phone } = req.body;
  const errors = {};

  // Validation
  if (!name || name.trim().length < 3) {
    errors.nameError = "name must be at least 3 characters.";
  }

  if (!email) {
    errors.emailError = "Email is required.";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.emailError = "Invalid email format.";
    }
  }

  if (!phone) {
    errors.phoneError = "Phone number is required.";
  }

  const firstFour = name.substring(0, 4); // first 4 letters of name
  const lastFour = phone.slice(-4);       // last 4 digits of phone
  const rawPassword = firstFour + lastFour;

  try {
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      errors.emailError = "User already exists with this email.";
    }

    if (Object.keys(errors).length > 0) {
      req.session.errors = errors;
      return res.redirect('/superadmin-add-admin');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Save admin data
    const newAdmin = new Admin({
      name,
      email,
      phone,
      password: hashedPassword
    });

    await newAdmin.save(); // Save to the database

    req.session.success = "Admin added successfully.";
    console.log(req.session.success);

    res.redirect('/superadmin-admin-list');
  } catch (err) {
    console.error(err);
    req.session.errors = { signUpError: "An error occurred during signup." };
    res.redirect('/superadmin-add-admin');
  }
};

exports.adminList = async (req, res) => {
  try {
    const search = req.query.search || "";
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const admins = await Admin.find(query).lean();
    res.json(admins);
  } catch (error) {
    console.error(error);
    res.status(500).json([]);
  }
};

// exports.getAdminProfile = async (req, res) => {
//   try {
//     const adminId = req.query.adminId;
//     if (!adminId) {
//       return res.status(401).json({ error: "Not authorized. Please log in." });
//     }

//     const admin = await Admin.findById(adminId).select('-password'); // exclude password

//     if (!admin) {
//       return res.status(404).json({ error: "Admin not found." });
//     }

//     res.status(200).json(admin);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error while fetching profile data." });
//   }
// }

exports.getAdminProfile = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized. Please log in." });
    }

    // Try finding as Admin
    let user = await Admin.findById(userId).select("-password");
    let role = "admin";

    // If not found as Admin, try Trainer
    if (!user) {
      user = await Trainer.findById(userId).select("-password");
      role = "trainer";
    }

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json({
      role,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching profile data." });
  }
};


exports.sendAdminOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save email in session (optional)
    req.session.email = email;

    // Delete any existing OTPs for this email
    await OtpDb.deleteMany({ email });

    // Save new OTP to DB with 60s expiry
    const newOtp = new OtpDb({
      email: email,
      otp: otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * 1000 // 60 seconds
    });

    await newOtp.save();

    // Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

    // Mailgen config
    const mailGenerator = new Mailgen({
      theme: 'default',
      product: {
        name: 'Gym Management App',
        link: 'https://yourdomain.com/',
      },
    });

    // Mail content
    const emailTemplate = {
      body: {
        name: 'User',
        intro: `Your OTP code is: **${otp}**`,
        outro: 'This OTP is valid for 60 seconds. If you didn’t request this, ignore the email.',
      },
    };

    const mailBody = mailGenerator.generate(emailTemplate);

    const message = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: 'OTP Verification Code',
      html: mailBody,
    };

    await transporter.sendMail(message);

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });

  } catch (error) {
    console.error('OTP send error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

exports.verifyAdminOTP = async (req, res) => {
  const { role, email, otp, name, phone, password, newPassword, confirmPassword } = req.body;

  try {
    // 1️⃣ Check OTP
    const otpRecord = await OtpDb.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.json({ success: false, message: 'OTP not found.' });
    }

    if (Date.now() > otpRecord.expiresAt) {
      await OtpDb.deleteOne({ _id: otpRecord._id });
      return res.json({ success: false, message: 'OTP expired.' });
    }

    if (otpRecord.otp !== otp) {
      return res.json({ success: false, message: 'Invalid OTP.' });
    }

    if (newPassword !== confirmPassword) {
      return res.json({ success: false, message: 'Passwords do not match.' });
    }

    // 2️⃣ Find user depending on role
    let user;
    if (role === "admin") {
      user = await Admin.findOne({ email });
    } else if (role === "trainer") {
      user = await Trainer.findOne({ email });
    } else {
      return res.json({ success: false, message: 'Invalid role.' });
    }

    if (!user) {
      return res.json({ success: false, message: 'User not found.' });
    }

    // 3️⃣ Verify current password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Current password is incorrect.' });
    }

    // 4️⃣ Hash new password & update fields
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.name = name;   // ⚠️ in your schema it’s probably "username", not "name"
    user.phone = phone;

    await user.save();
    await OtpDb.deleteOne({ _id: otpRecord._id });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Server error.' });
  }
};


exports.addBranch = async (req, res) => {
  try {
    const {
      name, // branch name
      phone,
      address,
      city,
      state,
      pincode,
      lat,
      lng
    } = req.body;


    // Create branch object
    const newBranch = new Branch({
      name: name,
      contact: {
        phone
      },
      location: {
        address,
        city,
        state,
        pincode,
        geo: {
          lat: lat || null,
          lng: lng || null
        }
      }
    });

    await newBranch.save();

    return res.redirect('/admin-branches-list'); // adjust this redirect path as needed
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).send('Server error while adding branch.');
  }
};

// exports.branchList = async (req, res) => {
//   try {
//     let page = parseInt(req.query.page) || 1;
//     let limit = 1;
//     let skip = (page - 1) * limit;

//     // Count total branches for pagination
//     const totalBranches = await Branch.countDocuments();

//     const branches = await Branch.aggregate([
//       {
//         $lookup: {
//           from: "trainers",            // collection name
//           localField: "_id",
//           foreignField: "branch",      // trainer schema field
//           as: "trainersList"
//         }
//       },
//       {
//         $lookup: {
//           from: "clients",
//           localField: "_id",
//           foreignField: "branchId",    // client schema field
//           as: "clientsList"
//         }
//       },
//       {
//         $project: {
//           _id: 0,                      // hide _id
//           name: 1,
//           trainersCount: { $size: "$trainersList" },
//           clientsCount: { $size: "$clientsList" }
//         }
//       },
//       { $skip: skip },
//       { $limit: limit }
//     ]);

//     res.status(200).json({
//       branches,
//       totalPages: Math.ceil(totalBranches / limit),
//       currentPage: page
//     });
//   } catch (error) {
//     console.error("Error fetching branches: ", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

exports.branchList = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 5; // adjust as needed
    let skip = (page - 1) * limit;

    let search = req.query.search || "";

    // search condition
    let match = {};
    if (search) {
      match = { name: { $regex: search, $options: "i" } };
    }

    const totalBranches = await Branch.countDocuments(match);

    const branches = await Branch.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "trainers",
          localField: "_id",
          foreignField: "branch",
          as: "trainersList"
        }
      },
      {
        $lookup: {
          from: "clients",
          localField: "_id",
          foreignField: "branchId",
          as: "clientsList"
        }
      },
      {
        $project: {
          name: 1,
          trainersCount: { $size: "$trainersList" },
          clientsCount: { $size: "$clientsList" }
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);
    console.log(branches);

    res.status(200).json({
      branches,
      totalPages: Math.ceil(totalBranches / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching branches: ", error);
    res.status(500).json({ message: "Server Error" });
  }
};


exports.getBranchNames = async (req, res) => {
  try {
    const branches = await Branch.find({}, { name: 1, _id: 1 });

    res.status(200).json({ success: true, branches });
  } catch (error) {
    console.error("Error fetching branch names: ", error);
    res.status(500).json({ message: "Server Error" });
  }
}

exports.addTrainers = async (req, res) => {
  try {
    const { name, email, phone, branch } = req.body;

    // Check if email already exists
    const existingTrainer = await Trainer.findOne({ email });
    if (existingTrainer) {
      req.session.errors = ['Trainer with this email already exists'];
      return res.redirect('/admin-add-trainer');
    }

    const firstFour = name.substring(0, 4); // first 4 letters of name
    const lastFour = phone.slice(-4);       // last 4 digits of phone
    const rawPassword = firstFour + lastFour;
    // Hash password
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Create trainer object
    const newTrainer = new Trainer({
      name,
      email,
      phone,
      branch,
      password: hashedPassword
    });

    await newTrainer.save();

    req.session.success = 'Trainer added successfully!';
    return res.redirect('/admin-trainers-list'); // change route if needed
  } catch (error) {
    console.error('Error creating trainer:', error);
    res.status(500).send('Server error while adding trainer.');
  }
}

// exports.trainersList = async (req, res) => {
//   try {
//     let page = parseInt(req.query.page) || 1;
//     let limit = 1;
//     let skip = (page - 1) * limit;

//     // Get total trainers count
//     const totalTrainers = await Trainer.countDocuments();

//     const trainers = await Trainer.aggregate([
//       {
//         $lookup: {
//           from: "branches",
//           localField: "branch",
//           foreignField: "_id",
//           as: "branchInfo"
//         }
//       },
//       {
//         $unwind: {
//           path: "$branchInfo",
//           preserveNullAndEmptyArrays: true
//         }
//       },
//       {
//         $lookup: {
//           from: "clients",
//           let: { trainerId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$trainerId", "$$trainerId"] },
//                 status: "Active"
//               }
//             }
//           ],
//           as: "clientsHandled"
//         }
//       },
//       {
//         $addFields: {
//           clientsCount: { $size: "$clientsHandled" }
//         }
//       },
//       {
//         $project: {
//           name: 1,
//           email: 1,
//           phone: 1,
//           password: 1,
//           branchName: "$branchInfo.name",
//           clientsCount: 1
//         }
//       },
//       { $skip: skip },
//       { $limit: limit }
//     ]);

//     res.status(200).json({
//       trainers,
//       totalPages: Math.ceil(totalTrainers / limit),
//       currentPage: page
//     });
//   } catch (error) {
//     console.error("Error fetching trainers: ", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// exports.trainersList = async (req, res) => {
//   try {
//     let page = parseInt(req.query.page) || 1;
//     let limit = 5;  // adjust as needed
//     let skip = (page - 1) * limit;

//     let search = req.query.search || "";

//     // search condition
//     let match = {};
//     if (search) {
//       match = {
//         $or: [
//           { name: { $regex: search, $options: "i" } },
//           { email: { $regex: search, $options: "i" } },
//           { phone: { $regex: search, $options: "i" } }
//         ]
//       };
//     }

//     // Count trainers with filter
//     const totalTrainers = await Trainer.countDocuments(match);

//     const trainers = await Trainer.aggregate([
//       { $match: match },
//       {
//         $lookup: {
//           from: "branches",
//           localField: "branch",
//           foreignField: "_id",
//           as: "branchInfo"
//         }
//       },
//       { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "clients",
//           let: { trainerId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$trainerId", "$$trainerId"] },
//                 status: "Active"
//               }
//             }
//           ],
//           as: "clientsHandled"
//         }
//       },
//       {
//         $addFields: {
//           clientsCount: { $size: "$clientsHandled" }
//         }
//       },
//       {
//         $project: {
//           name: 1,
//           email: 1,
//           phone: 1,
//           branchName: "$branchInfo.name",
//           clientsCount: 1
//         }
//       },
//       { $skip: skip },
//       { $limit: limit }
//     ]);

//     res.status(200).json({
//       trainers,
//       totalPages: Math.ceil(totalTrainers / limit),
//       currentPage: page
//     });
//   } catch (error) {
//     console.error("Error fetching trainers: ", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

exports.trainersList = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 5;
    let skip = (page - 1) * limit;

    let search = req.query.search || "";
    let branch = req.query.branch || "";

    // Base filter
    let match = {};
    if (search) {
      match.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    // Branch filter
    if (branch) {
      match.branch = new mongoose.Types.ObjectId(branch);
    }

    // Count trainers
    const totalTrainers = await Trainer.countDocuments(match);

    const trainers = await Trainer.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchInfo"
        }
      },
      { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "clients",
          let: { trainerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$trainerId", "$$trainerId"] },
                status: "Active"
              }
            }
          ],
          as: "clientsHandled"
        }
      },
      {
        $addFields: {
          clientsCount: { $size: "$clientsHandled" }
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          branchName: "$branchInfo.name",
          clientsCount: 1
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);

    res.status(200).json({
      trainers,
      totalPages: Math.ceil(totalTrainers / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching trainers: ", error);
    res.status(500).json({ message: "Server Error" });
  }
};



exports.getTrainersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return res.status(400).json({ message: 'Branch ID is required' });
    }

    const trainers = await Trainer.find({ branch: branchId }).select('name _id');
    res.status(200).json({ trainers });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// exports.addClients = async (req, res) => {
//   try {
//     console.log(req.body);

//     const { name, email, phone, altphone, gender, age, branch, trainer, height, weight } = req.body;
//     const errors = {};

//     // ✅ Required field checks
//     if (!name) errors.name = "Name is required.";
//     if (!email) errors.email = "Email is required.";
//     if (!phone) errors.phone = "Phone number is required.";
//     if (!age) errors.age = "Age is required.";
//     if (!gender) errors.gender = "Gender is required.";
//     if (!branch) errors.branch = "Branch is required.";
//     if (!trainer) errors.trainer = "Trainer is required.";

//     // ✅ Email format check
//     const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (email && !emailPattern.test(email)) {
//       errors.email = "Invalid email format.";
//     }

//     // ✅ If errors → back to form
//     if (Object.keys(errors).length > 0) {
//       req.session.errors = errors;
//       return res.redirect("/admin-add-clients");
//     }

//     // ✅ Check if client already exists
//     const existingClient = await Client.findOne({ email });
//     if (existingClient) {
//       req.session.errors = { email: "Email is already registered." };
//       return res.redirect("/admin-add-clients");
//     }

//     // ✅ Check Branch exists
//     const branchExists = await Branch.findById(branch);
//     if (!branchExists) {
//       req.session.errors = { branch: "Selected branch does not exist." };
//       return res.redirect("/admin-add-clients");
//     }

//     // ✅ Check Trainer exists
//     const trainerExists = await Trainer.findById(trainer);
//     if (!trainerExists) {
//       req.session.errors = { trainer: "Selected trainer does not exist." };
//       return res.redirect("/admin-add-clients");
//     }

//     const firstFour = name.substring(0, 4); // first 4 letters of name
//     const lastFour = phone.slice(-4);       // last 4 digits of phone
//     const rawPassword = firstFour + lastFour;

//     // ✅ Hash password
//     const hashedPassword = await bcrypt.hash(rawPassword, 10);

//     // ✅ Save new client
//     const newClient = new Client({
//       name,
//       email,
//       phone,
//       altphone: altphone || null, // optional
//       gender,
//       age,
//       branchId: branchExists._id,
//       trainerId: trainerExists._id,
//       height: height || null,
//       weight: weight || null,
//       password: hashedPassword
//     });

//     await newClient.save();

//     // ✅ Redirect with success
//     req.session.success = "Client added successfully.";
//     return res.redirect("/admin-clients-list");

//   } catch (err) {
//     console.error("Error adding client:", err);
//     req.session.errors = { server: "Something went wrong while adding the client." };
//     return res.redirect("/admin-add-clients");
//   }
// };

// exports.addClients = async (req, res) => {
//   try {
//     console.log(req.body);

//     const {
//       name, email, phone, altphone, gender, age,
//       branch, trainer, height, weight,
//       package: packageId, paymentMethod
//     } = req.body;

//     const errors = {};

//     // 🟢 Validation same as before ...
//     if (!name) errors.name = "Name is required.";
//     if (!email) errors.email = "Email is required.";
//     if (!phone) errors.phone = "Phone number is required.";
//     if (!age) errors.age = "Age is required.";
//     if (!gender) errors.gender = "Gender is required.";
//     if (!branch) errors.branch = "Branch is required.";
//     if (!trainer) errors.trainer = "Trainer is required.";
//     if (!packageId) errors.package = "Package is required.";
//     if (!paymentMethod) errors.paymentMethod = "Payment Method is required.";

//     if (Object.keys(errors).length > 0) {
//       req.session.errors = errors;
//       return res.redirect("/admin-add-clients");
//     }

//     // Check email
//     const existingClient = await Client.findOne({ email });
//     if (existingClient) {
//       req.session.errors = { email: "Email is already registered." };
//       return res.redirect("/admin-add-clients");
//     }

//     const branchExists = await Branch.findById(branch);
//     if (!branchExists) {
//       req.session.errors = { branch: "Selected branch does not exist." };
//       return res.redirect("/admin-add-clients");
//     }

//     const trainerExists = await Trainer.findById(trainer);
//     if (!trainerExists) {
//       req.session.errors = { trainer: "Selected trainer does not exist." };
//       return res.redirect("/admin-add-clients");
//     }

//     const packageExists = await Package.findById(packageId);
//     if (!packageExists) {
//       req.session.errors = { package: "Selected package does not exist." };
//       return res.redirect("/admin-add-clients");
//     }

//     // Generate password
//     const firstFour = name.substring(0, 4);
//     const lastFour = phone.slice(-4);
//     const rawPassword = firstFour + lastFour;
//     const hashedPassword = await bcrypt.hash(rawPassword, 10);

//     // Save Client
//     const newClient = new Client({
//       name,
//       email,
//       phone,
//       altphone: altphone || null,
//       gender,
//       age,
//       branchId: branchExists._id,
//       trainerId: trainerExists._id,
//       height: height || null,
//       weight: weight || null,
//       password: hashedPassword
//     });

//     const savedClient = await newClient.save();

//     // Save Membership
//     const paidDate = new Date();
//     const expiredDate = new Date(paidDate);
//     expiredDate.setDate(paidDate.getDate() + packageExists.durationInDays);

//     let paymentStatus = "Pending";

//     // check confirmedPayment
//     if (confirmedPayment === true || confirmedPayment === "true") {
//       paymentStatus = "Completed";
//     }

//     const newMembership = new Membership({
//       clientId: savedClient._id,
//       package: packageExists._id,
//       price: packageExists.price,
//       paymentMethod,
//       paymentStatus,
//       confirmedPayment,
//       paidDate,
//       expiredDate,
//       status: "Active"
//     });

//     await newMembership.save();

//     // 🔹 If payment method is UPI → generate Razorpay Payment Link
//     if (paymentMethod === "UPI") {
//       const razorpay = new Razorpay({
//         key_id: process.env.RAZORPAY_KEY_ID,
//         key_secret: process.env.RAZORPAY_SECRET
//       });

//       const order = await razorpay.orders.create({
//         amount: packageExists.price * 100, // in paise
//         currency: "INR",
//         receipt: `receipt_${savedClient._id}`,
//         payment_capture: 1
//       });

//       const paymentLink = `https://rzp.io/i/${order.id}`; // Or use short_url if you create Payment Links API

//       // 🔹 Send WhatsApp via Twilio
//       await clientTwilio.messages.create({
//         from: "whatsapp:+14155238886", // Twilio sandbox number
//         to: `whatsapp:+91${phone}`,    // Client's phone
//         body: `Hi ${name}, please complete your gym membership payment using this link: ${paymentLink}`
//       });
//     }

//     req.session.success = "Client & Membership added successfully.";
//     return res.redirect("/admin-clients-list");

//   } catch (err) {
//     console.error("Error adding client:", err);
//     req.session.errors = { server: "Something went wrong while adding the client." };
//     return res.redirect("/admin-add-clients");
//   }

//   //   // ✅ Done
//   //   req.session.success = "Client & Membership added successfully.";
//   //   return res.redirect("/admin-clients-list");

//   // } catch (err) {
//   //   console.error("Error adding client:", err);
//   //   req.session.errors = { server: "Something went wrong while adding the client." };
//   //   return res.redirect("/admin-add-clients");
//   // }
// };


exports.addClients = async (req, res) => {
  try {

    const {
      name, email, phone, altphone, gender, age,
      branch, trainer, height, weight,
      package: packageId, paymentMethod,
      confirmedPayment // ⚠️ comes from form as "true" or "false"
    } = req.body;

    const errors = {};

    // 🔹 Basic validation
    if (!name) errors.name = "Name is required.";
    if (!email) errors.email = "Email is required.";
    if (!phone) errors.phone = "Phone number is required.";
    if (!age) errors.age = "Age is required.";
    if (!gender) errors.gender = "Gender is required.";
    if (!branch) errors.branch = "Branch is required.";
    if (!trainer) errors.trainer = "Trainer is required.";
    if (!packageId) errors.package = "Package is required.";
    if (!paymentMethod) errors.paymentMethod = "Payment Method is required.";

    if (Object.keys(errors).length > 0) {
      req.session.errors = errors;
      return res.redirect("/admin-add-clients");
    }

    // 🔹 Ensure no duplicate email
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      req.session.errors = { email: "Email is already registered." };
      return res.redirect("/admin-add-clients");
    }

    // 🔹 Ensure branch/trainer/package exist
    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      req.session.errors = { branch: "Selected branch does not exist." };
      return res.redirect("/admin-add-clients");
    }

    const trainerExists = await Trainer.findById(trainer);
    if (!trainerExists) {
      req.session.errors = { trainer: "Selected trainer does not exist." };
      return res.redirect("/admin-add-clients");
    }

    const packageExists = await Package.findById(packageId);
    if (!packageExists) {
      req.session.errors = { package: "Selected package does not exist." };
      return res.redirect("/admin-add-clients");
    }

    // 🔹 Generate password from name + phone
    const firstFour = name.substring(0, 4);
    const lastFour = phone.slice(-4);
    const rawPassword = firstFour + lastFour;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 🔹 Save client
    const newClient = new Client({
      name,
      email,
      phone,
      altphone: altphone || null,
      gender,
      age,
      branchId: branchExists._id,
      trainerId: trainerExists._id,
      height: height || null,
      weight: weight || null,
      password: hashedPassword
    });

    const savedClient = await newClient.save();

    // 🔹 Normalize inputs
    const normalizedPaymentMethod = String(paymentMethod).toLowerCase();
    
    const isConfirmed = confirmedPayment === true || confirmedPayment === "true";

    
    // 🔹 Payment fields
    let paymentStatus = "Pending";
    let paidDate = null;
    let expiredDate = null;

    if (isConfirmed) {
      paymentStatus = "Completed";
      paidDate = new Date();
      expiredDate = new Date(paidDate);
      expiredDate.setDate(paidDate.getDate() + packageExists.durationInDays);
    }

    // 🔹 Save Membership
    const newMembership = new Membership({
      clientId: savedClient._id,
      package: packageExists._id,
      price: packageExists.price,
      paymentMethod,
      paymentStatus,
      confirmedPayment: isConfirmed,
      paidDate,
      expiredDate,
      status: "Active"
    });

    await newMembership.save();

    // ✅ If UPI → call paymentController (don’t create Razorpay here!)
    if (paymentMethod.toLowerCase() === "upi") {
      return res.redirect(`/payment/create-order?clientId=${savedClient._id}&packageId=${packageExists._id}`);
    }

    // 🔹 If UPI and not confirmed → Send payment link via WhatsApp
    // if (normalizedPaymentMethod === "upi") {
    //   console.log("✅ Entering UPI Payment Block");

    //   const razorpay = new Razorpay({
    //     key_id: process.env.RAZORPAY_KEY_ID,
    //     key_secret: process.env.RAZORPAY_SECRET
    //   });

    //   const paymentLink = await razorpay.paymentLink.create({
    //     amount: packageExists.price * 100, // paise
    //     currency: "INR",
    //     accept_partial: false,
    //     description: `Membership Payment for ${name}`,
    //     customer: {
    //       name: name,
    //       email: email,
    //       contact: `+91${phone}`
    //     },
    //     notify: { sms: false, email: false },
    //     reminder_enable: true
    //   });

    //   console.log("🔗 Razorpay Link:", paymentLink.short_url);

    //   // WhatsApp message via Twilio
    //   await clientTwilio.messages.create({
    //     from: "whatsapp:+14155238886", // Twilio sandbox
    //     to: `whatsapp:+91${phone}`,
    //     body: `Hi ${name}, please complete your gym membership payment using this link: ${paymentLink.short_url}`
    //   });
    // }

    // ✅ Success response
    req.session.success = "Client & Membership added successfully.";
    return res.redirect("/admin-clients-list");

  } catch (err) {
    console.error("❌ Error adding client:", err);
    req.session.errors = { server: "Something went wrong while adding the client." };
    return res.redirect("/admin-add-clients");
  }
};


// exports.clientsList = async (req, res) => {
//   try {
//     let page = parseInt(req.query.page) || 1;
//     let limit = 2;  // adjust page size
//     let skip = (page - 1) * limit;

//     let search = req.query.search || "";

//     // Search filter
//     let match = {};
//     if (search) {
//       match = {
//         $or: [
//           { name: { $regex: search, $options: "i" } },
//           { email: { $regex: search, $options: "i" } },
//           { phone: { $regex: search, $options: "i" } }
//         ]
//       };
//     }

//     // Count clients
//     const totalClients = await Client.countDocuments(match);

//     const clients = await Client.aggregate([
//       { $match: match },
//       {
//         $lookup: {
//           from: "branches",
//           localField: "branchId",
//           foreignField: "_id",
//           as: "branchInfo"
//         }
//       },
//       { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },
//       {
//         $lookup: {
//           from: "trainers",
//           localField: "trainerId",
//           foreignField: "_id",
//           as: "trainerInfo"
//         }
//       },
//       { $unwind: { path: "$trainerInfo", preserveNullAndEmptyArrays: true } },
//       {
//         $project: {
//           name: 1,
//           email: 1,
//           phone: 1,
//           branch: "$branchInfo.name",
//           trainer: "$trainerInfo.name"
//         }
//       },
//       { $skip: skip },
//       { $limit: limit }
//     ]);

//     res.status(200).json({
//       clients,
//       totalPages: Math.ceil(totalClients / limit),
//       currentPage: page
//     });
//   } catch (error) {
//     console.error("Error fetching clients: ", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

exports.clientsList = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 2;
    let skip = (page - 1) * limit;

    let search = req.query.search || "";
    let branchId = req.query.branchId || "";

    // Search filter
    let match = {};
    if (search) {
      match.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    if (branchId) {
      match.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const totalClients = await Client.countDocuments(match);

    const clients = await Client.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "branches",
          localField: "branchId",
          foreignField: "_id",
          as: "branchInfo"
        }
      },
      { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "trainers",
          localField: "trainerId",
          foreignField: "_id",
          as: "trainerInfo"
        }
      },
      { $unwind: { path: "$trainerInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          branch: "$branchInfo.name",
          trainer: "$trainerInfo.name"
        }
      },
      { $skip: skip },
      { $limit: limit }
    ]);

    res.status(200).json({
      clients,
      totalPages: Math.ceil(totalClients / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching clients: ", error);
    res.status(500).json({ message: "Server Error" });
  }
};


exports.getPackageList = async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 }); // Latest first
    console.log(packages);
    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages
    });

  } catch (error) {
    console.error("Error fetching package list:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching package list"
    });
  }
};


exports.addPackages = async (req, res) => {
  try {
    const { packageType, durationInDays, price } = req.body;
    console.log(req.body);

    // Validate required fields
    if (!packageType || !price) {
      return res.status(400).json({ success: false, message: "Duration and price are required." });
    }

    // Create and save new package
    const newPackage = new Package({ packageType, durationInDays, price });
    await newPackage.save();

    res.status(201).json({
      success: true,
      message: "Package added successfully.",
      package: newPackage
    });
  } catch (error) {
    console.error("Error adding package:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
