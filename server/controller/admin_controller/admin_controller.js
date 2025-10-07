const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const twilio = require("twilio");
const ExcelJS = require("exceljs");

const User = require("../../../model/user/user_schema"); // import your new user schema
const OtpDb = require("../../../model/admin/otp_schema")
const Branch = require("../../../model/admin/branch_schema");
const Package = require("../../../model/admin/package_schema")
const TrainerDetails = require("../../../model/trainers/trainerDetails_schema");
const ClientDetails = require("../../../model/clients/ClientDetails_schema")
const Membership = require("../../../model/clients/membership_schema")
const Payment = require("../../../model/payment/payment_schema")

const { uploadFileToS3 } = require("../../services/s3_service/s3_service");

const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// exports.adminLogin = async (req, res) => {
//   const superAdmin = {
//     email: process.env.ADMIN_EMAIL,
//     password: process.env.ADMIN_PASS,
//   };

//   console.log(req.body);
  
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
//     // 1️⃣ SuperAdmin Login
//     if (email === superAdmin.email) {
//       if (password === superAdmin.password) {
//         req.session.isSuperAdminAuthenticated = true;
//         req.session.isAnyAdminAuthenticated = true;
//         req.session.user = "superAdmin";
//         req.session.userType = "superAdmin";
//         return res.redirect("/admin-dashboard");
//       } else {
//         req.session.errors = { password: "Incorrect SuperAdmin password." };
//         return res.redirect("/admin-login");
//       }
//     }

//     // 2️⃣ Find User in DB
//     const user = await User.findOne({ email, userType: { $in: ["admin", "trainer"] } });
//     if (!user) {
//       req.session.errors = { email: "No admin or trainer account found with this email." };
//       return res.redirect("/admin-login");
//     }

//     // ✅ Compare password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       req.session.errors = { password: "Incorrect password." };
//       return res.redirect("/admin-login");
//     }

//     // 3️⃣ Handle login by role
//     req.session.userId = user._id;
//     req.session.user = user.name;
//     req.session.userType = user.userType;

//     if (user.userType === "admin") {
//       req.session.isAdminAuthenticated = true;
//       req.session.isAnyAdminAuthenticated = true;
//       return res.redirect("/admin-dashboard");
//     }

//     if (user.userType === "trainer") {
//       req.session.isTrainerAuthenticated = true;
//       return res.redirect("/trainer-dashboard");
//     }

//     // ❌ Just in case
//     // req.session.errors = { loginError: "Invalid user role." };
//     // return res.redirect("/admin-login");
//     return res.json({ success: false, errors });


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

  if (!email) errors.email = "Email is required.";
  if (!password) errors.password = "Password is required.";

  // If AJAX request -> return JSON
  const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;

  if (Object.keys(errors).length > 0) {
    if (isAjax) return res.json({ success: false, errors });
    req.session.errors = errors;
    return res.redirect("/admin-login");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    const err = { email: "Invalid email format." };
    if (isAjax) return res.json({ success: false, errors: err });
    req.session.errors = err;
    return res.redirect("/admin-login");
  }

  try {
    // SuperAdmin
    if (email === superAdmin.email) {
      if (password === superAdmin.password) {
        req.session.isSuperAdminAuthenticated = true;
        req.session.isAnyAdminAuthenticated = true;
        req.session.user = "Super Admin";
        req.session.userType = "superAdmin";
        if (isAjax) return res.json({ success: true, redirect: "/admin-dashboard" });
        return res.redirect("/admin-dashboard");
      } else {
        const err = { password: "Incorrect SuperAdmin password." };
        if (isAjax) return res.json({ success: false, errors: err });
        req.session.errors = err;
        return res.redirect("/admin-login");
      }
    }

    // DB User
    const user = await User.findOne({ email, userType: { $in: ["admin", "trainer"] } });
    if (!user) {
      const err = { email: "No admin or trainer account found with this email." };
      if (isAjax) return res.json({ success: false, errors: err });
      req.session.errors = err;
      return res.redirect("/admin-login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = { password: "Incorrect password." };
      if (isAjax) return res.json({ success: false, errors: err });
      req.session.errors = err;
      return res.redirect("/admin-login");
    }

    req.session.userId = user._id;
    req.session.user = user.name;
    req.session.userType = user.userType;

    if (user.userType === "admin") {
      req.session.isAdminAuthenticated = true;
      req.session.isAnyAdminAuthenticated = true;
      req.session.isAdminOrTrainerAuthenticated = true;
      if (isAjax) return res.json({ success: true, redirect: "/admin-dashboard" });
      return res.redirect("/admin-dashboard");
    }

    if (user.userType === "trainer") {
      req.session.isTrainerAuthenticated = true;
      req.session.isAdminOrTrainerAuthenticated = true;
      if (isAjax) return res.json({ success: true, redirect: "/trainer-dashboard" });
      return res.redirect("/trainer-dashboard");
    }

  } catch (err) {
    console.error(err);
    const errMsg = { loginError: "Something went wrong during login." };
    if (isAjax) return res.json({ success: false, errors: errMsg });
    req.session.errors = errMsg;
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

    // 🔹 Check user type in DB
    const user = await User.findOne({ email });
    if (!user) {
      req.session.errors = { email: "No account found with this email" };
      return res.redirect("/admin-forgot-password");
    }

    // 🔹 Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // 🔹 Save email and userType in session
    req.session.email = email;
    req.session.userType = user.userType;

    // 🔹 Check if same OTP already exists for this email
    const existingOtp = await OtpDb.findOne({ email, otp });

    if (existingOtp) {
      await OtpDb.deleteOne({ _id: existingOtp._id }); // remove duplicate
    } else {
      await OtpDb.deleteMany({ email }); // remove old OTPs for this email
    }

    // 🔹 Save new OTP with 60s expiry
    const newOtp = new OtpDb({
      email,
      otp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * 1000, // 60 seconds
    });

    await newOtp.save();

    // 🔹 Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });

    // 🔹 Mailgen configuration
    const mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "Gym Management App",
        link: "https://yourdomain.com/",
      },
    });

    // 🔹 Mail content
    const emailTemplate = {
      body: {
        name: user.name || "User",
        intro: `Your OTP code is: **${otp}**`,
        outro: "This OTP is valid for 60 seconds. If you didn’t request this, ignore the email.",
      },
    };

    const mailBody = mailGenerator.generate(emailTemplate);

    const message = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "OTP Verification Code",
      html: mailBody,
    };

    // 🔹 Send the email
    await transporter.sendMail(message);

    // ✅ Show OTP input in correct page based on user type
    req.session.showOtp = true;

    if (user.userType === "client") {
      return res.redirect("/forgot-password");
    } else {
      return res.redirect("/admin-forgot-password");
    }

  }catch (error) {
  console.error("OTP send error:", error);
  req.session.errors = { general: "Failed to send OTP" };

  // 🔹 Redirect based on userType if available
  if (req.session.userType === "client") {
    return res.redirect("/forgot-password");
  } else {
    return res.redirect("/admin-forgot-password");
  }
}
};

exports.verify_OTP = async (req, res) => {
  const { otp } = req.body;
  const email = req.session.email;
  
  try {
    const otpRecord = await OtpDb.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      req.session.errors = { otp: "OTP not found." };
      req.session.showOtp = true;
      return req.session.userType === "client"
        ? res.redirect("/forgot-password")
        : res.redirect("/admin-forgot-password");
    }

    if (Date.now() > otpRecord.expiresAt) {
      await OtpDb.deleteOne({ _id: otpRecord._id });
      req.session.errors = { otp: "OTP expired." };
      req.session.showOtp = true;
      return req.session.userType === "client"
        ? res.redirect("/forgot-password")
        : res.redirect("/admin-forgot-password");
    }

    if (otpRecord.otp.toString() !== otp.join("")) {
      req.session.errors = { otp: "Invalid OTP." };
      req.session.showOtp = true;
      return req.session.userType === "client"
        ? res.redirect("/forgot-password")
        : res.redirect("/admin-forgot-password");
    }

    // ✅ OTP valid
    await OtpDb.deleteOne({ _id: otpRecord._id });

    req.session.resetEmail = email; // store email for next step

    return req.session.userType === "client"
      ? res.redirect("/change-password")
      : res.redirect("/admin-change-password");

  } catch (err) {
    console.error(err);
    req.session.errors = { otp: "Server error." };
    req.session.showOtp = true;
    return req.session.userType === "client"
      ? res.redirect("/forgot-password")
      : res.redirect("/admin-forgot-password");
  }
};

exports.change_password = async (req, res) => {
  const { new_password, confirm_password } = req.body;
  const email = req.session?.resetEmail;  // ✅ email stored in session
  const userType = req.session?.userType; // ✅ userType stored in session
  const errors = {};

  try {
    if (!email) {
      return res.json({ success: false, message: "Session expired. Please try again." });
    }

    if (!new_password || !confirm_password) {
      errors.password = "Both password fields are required.";
    } else if (new_password !== confirm_password) {
      errors.password = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      return res.json({ success: false, errors });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    user.password = hashedPassword;
    await user.save();

    // Success message
    req.session.success = "Password updated successfully.";

    // ✅ Redirect to correct login page
    return userType === "client"
      ? res.redirect("/login")
      : res.redirect("/admin-login");

  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error." });
  }
};

// Dashboard Counts Controller
exports.getDashboardCounts = async (req, res) => {
  try {
    // Run all counts in parallel for better performance
    const [branches, trainers, clients] = await Promise.all([
      Branch.countDocuments({ isActive: true }), // only active branches
      User.countDocuments({ userType: "trainer", isActive: true }),
      User.countDocuments({ userType: "client", isActive: true })
    ]);

    res.json({
      success: true,
      data: { branches, trainers, clients }
    });
  } catch (error) {
    console.error("Error fetching dashboard counts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.addAdmin = async (req, res) => {
  const { name, email, phone } = req.body;
  const errors = {};

  // Validation
  if (!name || name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = "Invalid email format.";
    }
  }

  if (!phone) {
    errors.phone = "Phone number is required.";
  }

  const firstFour = name.substring(0, 4);
  const lastFour = phone.slice(-4);
  const rawPassword = firstFour + lastFour;

  try {
    // Check for duplicates
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      if (existingUser.email === email) {
        errors.email = "User already exists with this email.";
      }
      if (existingUser.phone === phone) {
        errors.phone = "User already exists with this phone number.";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newAdmin = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      userType: "admin"
    });

    await newAdmin.save();

    return res.status(200).json({ message: "Admin added successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ errors: { signUpError: "An error occurred during signup." } });
  }
};

exports.adminList = async (req, res) => {
  try {
    const search = req.query.search || "";
    const query = { userType: "admin" }; // ✅ only fetch admins

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const admins = await User.find(query).lean();
    res.json(admins);
  } catch (error) {
    console.error("Error fetching admin list:", error);
    res.status(500).json([]);
  }
};

exports.getAdminDetails = async (req, res) => {
  try {
    const { id: adminId } = req.params;

    // ✅ Select only required fields
    const admin = await User.findById(adminId)
      .select("_id name email phone userType")
      .lean(); // return plain JS object for faster response

    if (!admin) {
      return res.status(404).json({ success: false, error: "Admin not found" });
    }

    res.json({ success: true, admin });
  } catch (err) {
    console.error("❌ Error fetching admin:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    let errors = {};

    // 🔎 Check if email already exists for another admin
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        errors.email = "This email is already taken";
      }
    }

    // 🔎 Check if phone already exists for another admin
    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: id } });
      if (existingPhone) {
        errors.phone = "This phone number is already registered";
      }
    }

    // ❌ If any validation errors found → send them together
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // ✅ Update admin
    const updatedAdmin = await User.findByIdAndUpdate(
      id,
      { name, email, phone },
      { new: true, runValidators: true, fields: "_id name email phone userType" }
    ).lean();

    if (!updatedAdmin) {
      return res.status(404).json({ success: false, error: "Admin not found" });
    }

    res.json({ success: true, admin: updatedAdmin });
  } catch (err) {
    console.error("❌ Error updating admin:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAdmin = await User.findByIdAndDelete(id);

    if (!deletedAdmin) {
      return res.status(404).json({ success: false, error: "Admin not found" });
    }

    res.json({ success: true, message: "Admin deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting admin:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

exports.getAdminProfile = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: "Not authorized. Please log in." });
    }

    // Find user by ID, exclude password
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      role: user.userType, // now role comes from schema
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
  const { userType, email, otp, name, phone, password, newPassword, confirmPassword } = req.body;

  try {
    // 1️⃣ Check OTP
    const otpRecord = await OtpDb.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.json({ success: false, message: "OTP not found." });
    }

    if (Date.now() > otpRecord.expiresAt) {
      await OtpDb.deleteOne({ _id: otpRecord._id });
      return res.json({ success: false, message: "OTP expired." });
    }

    if (otpRecord.otp !== otp) {
      return res.json({ success: false, message: "Invalid OTP." });
    }

    if (newPassword !== confirmPassword) {
      return res.json({ success: false, message: "Passwords do not match." });
    }

    // 2️⃣ Find user by role and email
    const user = await User.findOne({ email, userType: userType });
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    // 3️⃣ Verify current password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Current password is incorrect." });
    }

    // 4️⃣ Hash new password & update fields
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.name = name;
    user.phone = phone;

    await user.save();
    await OtpDb.deleteOne({ _id: otpRecord._id });

    return res.json({ success: true, message: "Profile updated successfully." });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error." });
  }
};


exports.addBranch = async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode, lat, lng } = req.body;

    let errors = {};

    if (!name || name.trim() === '') {
      errors.name = "Branch name is required";
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      errors.phone = "Valid 10-digit phone number is required";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // ✅ Duplicate check (by branch name, you can also include city)
    const branchExists = await Branch.findOne({ name: name.trim(), "location.city": city.trim() });
    if (branchExists) {
      return res.status(400).json({ success: false, errors: { name: "Branch already exists in this city." } });
    }

    const newBranch = new Branch({
      name,
      phone,
      location: {
        address,
        city,
        state,
        pincode,
        geo: { lat: lat || null, lng: lng || null }
      }
    });

    await newBranch.save();

    return res.status(200).json({ success: true, message: "Branch added successfully." });
  } catch (error) {
    console.error("Error creating branch:", error);
    return res.status(500).json({ success: false, errors: { server: "Server error" } });
  }
};

exports.checkBranch = async (req, res) => {
  try {
    console.log(req.query);
    
    const { name } = req.query;
    if (!name || !name.trim()) {
      return res.json({ exists: false });
    }

    const branchExists = await Branch.findOne({ name: name.trim() });
    return res.json({ exists: !!branchExists });
  } catch (err) {
    console.error("Error checking branch:", err);
    return res.status(500).json({ exists: false });
  }
}


exports.branchList = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 5;
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

      // ✅ Join with TrainerDetails
      {
        $lookup: {
          from: "trainerdetails", // correct collection
          localField: "_id",
          foreignField: "branch",
          as: "trainersList"
        }
      },

      // ✅ Join with ClientDetails
      {
        $lookup: {
          from: "clientdetails", // correct collection
          localField: "_id",
          foreignField: "branch", // correct field name
          as: "clientsList"
        }
      },

      // ✅ Project with counts
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

exports.getBranchDetails = async (req, res) => {
  try {
    const { id: branchId } = req.params;

    // ✅ Select only required fields
    const branch = await Branch.findById(branchId)
      .select("_id name location phone")
      .lean();

    if (!branch) {
      return res.status(404).json({ success: false, error: "Branch not found" });
    }

    res.json({ success: true, branch });
  } catch (err) {
    console.error("❌ Error fetching branch:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, city, state, pincode, lat, lng } = req.body;

    let errors = {};

    // 🔎 Check if another branch already has this name
    if (name) {
      const existingBranch = await Branch.findOne({ name, _id: { $ne: id } });
      if (existingBranch) {
        errors.name = "This branch name is already taken";
      }
    }

    // 🔎 Check if phone is already used
    // if (phone) {
    //   const existingPhone = await Branch.findOne({ phone, _id: { $ne: id } });
    //   if (existingPhone) {
    //     errors.phone = "This phone number is already registered";
    //   }
    // }

    // ❌ If errors exist, stop here
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // ✅ Update branch
    const updatedBranch = await Branch.findByIdAndUpdate(
      id,
      {
        name,
        phone,
        location: { address, city, state, pincode },
        geo: { lat, lng },
      },
      {
        new: true,
        runValidators: true,
        fields: "_id name phone location geo"
      }
    ).lean();

    if (!updatedBranch) {
      return res.status(404).json({ success: false, error: "Branch not found" });
    }

    res.json({ success: true, branch: updatedBranch });
  } catch (err) {
    console.error("❌ Error updating branch:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedBranch = await Branch.findByIdAndDelete(id);

    if (!deletedBranch) {
      return res.status(404).json({ success: false, error: "Branch not found" });
    }

    res.json({ success: true, message: "Branch deleted successfully!" });
  } catch (err) {
    console.error("❌ Error deleting branch:", err.message);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

// exports.addTrainers = async (req, res) => {
//   try {
//     const { name, email, phone, branch } = req.body;

//     // Check if trainer already exists
//     const existingTrainer = await User.findOne({ email, userType: "trainer" });
//     if (existingTrainer) {
//       req.session.errors = ['Trainer with this email already exists'];
//       return res.redirect('/admin-add-trainer');
//     }

//     // Generate password from name + phone
//     const firstFour = name.substring(0, 4);
//     const lastFour = phone.slice(-4);
//     const rawPassword = firstFour + lastFour;
//     const hashedPassword = await bcrypt.hash(rawPassword, 10);

//     // Step 1: Create trainer in User collection
//     const newTrainer = new User({
//       name,
//       email,
//       phone,
//       password: hashedPassword,
//       userType: "trainer"
//     });
//     const savedTrainer = await newTrainer.save();

//     // Step 2: Create trainer details (branch mapping)
//     const trainerDetails = new TrainerDetails({
//       trainerId: savedTrainer._id,
//       branch
//     });

//     await trainerDetails.save();

//     req.session.success = 'Trainer added successfully!';
//     return res.redirect('/admin-trainers-list');

//   } catch (error) {
//     console.error('Error creating trainer:', error);
//     res.status(500).send('Server error while adding trainer.');
//   }
// };

// exports.addTrainers = async (req, res) => {
//   try {
//     const { name, email, phone, branch } = req.body;

//     let errors = {};

//     // ✅ Name validation
//     if (!name || name.trim() === "") {
//       errors.name = "Trainer name is required";
//     }

//     // ✅ Email validation
//     if (!email || email.trim() === "") {
//       errors.email = "Email is required";
//     } else {
//       const existingTrainer = await User.findOne({ email, userType: "trainer" });
//       if (existingTrainer) {
//         errors.email = "Trainer with this email already exists";
//       }
//     }

//     // ✅ Phone validation
//     if (!phone || phone.trim() === "") {
//       errors.phone = "Phone number is required";
//     } else if (!/^\d{10}$/.test(phone)) {
//       errors.phone = "Phone number must be 10 digits";
//     }

//     // ✅ Branch validation
//     if (!branch || branch.trim() === "") {
//       errors.branch = "Branch selection is required";
//     }

//     // ❌ If validation errors exist → store in session
//     if (Object.keys(errors).length > 0) {
//       req.session.errors = errors;
//       req.session.formData = req.body; // store input so user doesn’t retype
//       return res.redirect("/admin-add-trainer");
//     }

//     // ✅ Generate password from name + phone
//     const firstFour = name.substring(0, 4);
//     const lastFour = phone.slice(-4);
//     const rawPassword = firstFour + lastFour;
//     const hashedPassword = await bcrypt.hash(rawPassword, 10);

//     // ✅ Step 1: Create trainer in User collection
//     const newTrainer = new User({
//       name,
//       email,
//       phone,
//       password: hashedPassword,
//       userType: "trainer"
//     });
//     const savedTrainer = await newTrainer.save();

//     // ✅ Step 2: Create trainer details (branch mapping)
//     const trainerDetails = new TrainerDetails({
//       trainerId: savedTrainer._id,
//       branch
//     });

//     await trainerDetails.save();

//     req.session.success = "Trainer added successfully!";
//     return res.redirect("/admin-trainers-list");

//   } catch (error) {
//     console.error("Error creating trainer:", error);
//     req.session.errors = { server: "Server error while adding trainer." };
//     return res.redirect("/admin-add-trainer");
//   }
// };

exports.addTrainers = async (req, res) => {
  try {
    console.log(req.body);
    
    const { name, email, phone, branch } = req.body;
    let errors = {};

    // Name validation
    if (!name || name.trim() === "") {
      errors.name = "Trainer name is required";
    }

    // Phone validation
    if (!phone || phone.trim() === "") {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(phone)) {
      errors.phone = "Phone number must be 10 digits";
    }

    // If validation fails
    if (Object.keys(errors).length > 0) {
      return res.json({ success: false, errors });
    }

    // ✅ Check duplicate phone number
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.json({
        success: false,
        errors: { phone: "Phone number already exists" }
      });
    }

    // Generate password from name + phone
    const firstFour = name.substring(0, 4);
    const lastFour = phone.slice(-4);
    const rawPassword = firstFour + lastFour;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Save trainer
    const newTrainer = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      userType: "trainer"
    });
    const savedTrainer = await newTrainer.save();

    await new TrainerDetails({
      trainerId: savedTrainer._id,
      branch
    }).save();

    return res.status(200).json({ success: true, message: "Trainer added successfully." });

  } catch (error) {
    console.error("Error creating trainer:", error);
    return res.json({
      success: false,
      errors: { server: "Server error while adding trainer." }
    });
  }
};


exports.trainersList = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 5;
    let skip = (page - 1) * limit;

    let search = req.query.search || "";
    let branch = req.query.branch || "";

    // Base filter for aggregation
    let match = {};

    // Branch filter
    if (branch) {
      match.branch = new mongoose.Types.ObjectId(branch);
    }

    // total trainers count
    const totalTrainers = await TrainerDetails.countDocuments(match);

    const trainers = await TrainerDetails.aggregate([
      { $match: match },

      // Join with User collection (trainer info)
      {
        $lookup: {
          from: "users", // User collection
          localField: "trainerId",
          foreignField: "_id",
          as: "trainerInfo"
        }
      },
      { $unwind: "$trainerInfo" },

      // Search filter
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "trainerInfo.name": { $regex: search, $options: "i" } },
                  { "trainerInfo.email": { $regex: search, $options: "i" } },
                  { "trainerInfo.phone": { $regex: search, $options: "i" } }
                ]
              }
            }
          ]
        : []),

      // Join with Branch collection
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchInfo"
        }
      },
      { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },

      // Join with ClientDetails collection
      {
        $lookup: {
          from: "clientdetails", // ✅ correct collection name
          let: { trainerId: "$trainerId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$trainerId", "$$trainerId"] },
                isActive: true // ✅ correct field from schema
              }
            }
          ],
          as: "clientsHandled"
        }
      },

      // Add count of clients
      {
        $addFields: {
          clientsCount: { $size: "$clientsHandled" }
        }
      },

      // ✅ Select final fields
      {
        $project: {
          trainerId: "$trainerInfo._id",
          name: "$trainerInfo.name",
          email: "$trainerInfo.email",
          phone: "$trainerInfo.phone",
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

    // Find trainers by branch and active status
    const trainers = await TrainerDetails.find({
      branch: branchId,
      isActive: true
    })
      .populate('trainerId', 'name _id') // only get name and _id from User
      .select('trainerId'); // we only need trainer info

    // Format response to return trainer objects cleanly
    const formattedTrainers = trainers.map(t => ({
      _id: t.trainerId._id,
      name: t.trainerId.name
    }));

    res.status(200).json({ trainers: formattedTrainers });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getTrainersDetails = async (req, res) => {
  try {
    const { id } = req.params; // trainerId == User._id
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid trainer ID" });
    }

    // Run both queries in parallel
    const [user, details] = await Promise.all([
      User.findById(id)
        .select("_id name email phone userType")
        .lean(),
      TrainerDetails.findOne({ trainerId: id })
        .select("_id trainerId branch")
        .populate({ path: "branch", select: "_id name", options: { lean: true } })
        .lean()
    ]);

    if (!user || !details) {
      return res.status(404).json({ success: false, error: "Trainer not found" });
    }

    // Shape response (only what you asked)
    return res.json({
      success: true,
      trainer: {
        trainerId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        branchId: details.branch ? details.branch._id : null,
        branchName: details.branch ? details.branch.name : null
      }
    });
  } catch (err) {
    console.error("❌ Error fetching trainer details:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// exports.updateTrainers = async (req, res) => {
//   try {
//     const trainerId = req.params.id; //
//     const { name, email, phone, branch } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(trainerId)) {
//       return res.status(400).json({ success: false, error: "Invalid Trainer ID" });
//     }

//     // ✅ Step 1: Update User info
//     const updatedUser = await User.findByIdAndUpdate(
//       trainerId,
//       { name, email, phone },
//       { new: true, runValidators: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ success: false, error: "Trainer (User) not found" });
//     }

//     // ✅ Step 2: Update branch in TrainerDetails if provided
//     let updatedTrainerDetails = null;
//     if (branch && mongoose.Types.ObjectId.isValid(branch)) {
//       updatedTrainerDetails = await TrainerDetails.findOneAndUpdate(
//         { trainerId: new mongoose.Types.ObjectId(trainerId) }, // ensure ObjectId
//         { branch },
//         { new: true, upsert: false }
//       ).populate("branch", "name");
//     }

//     res.json({
//       success: true,
//       message: "Trainer updated successfully",
//       trainer: {
//         _id: updatedUser._id,
//         name: updatedUser.name,
//         email: updatedUser.email,
//         phone: updatedUser.phone,
//         branch: updatedTrainerDetails ? updatedTrainerDetails.branch : null
//       }
//     });

//   } catch (err) {
//     console.error("❌ Error updating trainer:", err);
//     res.status(500).json({ success: false, error: "Server error while updating trainer" });
//   }
// };

exports.updateTrainers = async (req, res) => {
  try {
    const trainerId = req.params.id;
    const { name, email, phone, branch } = req.body;

    if (!mongoose.Types.ObjectId.isValid(trainerId)) {
      return res.status(400).json({ success: false, errors: { general: "Invalid Trainer ID" } });
    }

    let errors = {};

    // 🔎 Check email duplicate
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: trainerId } });
      if (existingEmail) errors.email = "This email is already taken";
    }

    // 🔎 Check phone duplicate
    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: trainerId } });
      if (existingPhone) errors.phone = "This phone number is already registered";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // ✅ Update User
    const updatedUser = await User.findByIdAndUpdate(
      trainerId,
      { name, email, phone },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, errors: { general: "Trainer not found" } });
    }

    // ✅ Update TrainerDetails
    let updatedTrainerDetails = null;
    if (branch && mongoose.Types.ObjectId.isValid(branch)) {
      updatedTrainerDetails = await TrainerDetails.findOneAndUpdate(
        { trainerId: new mongoose.Types.ObjectId(trainerId) },
        { branch },
        { new: true, upsert: false }
      ).populate("branch", "name");
    }

    res.json({
      success: true,
      message: "Trainer updated successfully",
      trainer: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        branch: updatedTrainerDetails ? updatedTrainerDetails.branch : null
      }
    });

  } catch (err) {
    console.error("❌ Error updating trainer:", err);
    res.status(500).json({ success: false, errors: { general: "Server error while updating trainer" } });
  }
};

exports.deleteTrainers = async (req, res) => {
  try {
    const trainerId = req.params.id; // ✅ match your route: /admin/delete-trainers/:id

    // 🔍 Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(trainerId)) {
      return res.status(400).json({ success: false, error: "Invalid Trainer ID" });
    }

    // ✅ Step 1: Delete from TrainerDetails
    await TrainerDetails.findOneAndDelete({ trainerId: trainerId });

    // ✅ Step 2: Delete from User
    const deletedUser = await User.findByIdAndDelete(trainerId);

    if (!deletedUser) {
      return res.status(404).json({ success: false, error: "Trainer not found" });
    }

    res.json({ success: true, message: "Trainer deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting trainer:", err);
    res.status(500).json({ success: false, error: "Server error while deleting trainer" });
  }
};

// exports.addClients = async (req, res) => {
//   try {
//     const {
//       name, email, phone, altphone, gender, age,
//       branch, trainer, height, weight,
//       package: packageId, paymentMethod,
//       confirmedPayment
//     } = req.body;

//     const errors = {};

//     // 🔹 Basic validation
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

//     // 🔹 Ensure no duplicate email
//     const existingUser = await User.findOne({ email, userType: "client" });
//     if (existingUser) {
//       req.session.errors = { email: "Email is already registered." };
//       return res.redirect("/admin-add-clients");
//     }

//     // 🔹 Ensure branch/package exist
//     const branchExists = await Branch.findById(branch);
//     if (!branchExists) {
//       req.session.errors = { branch: "Selected branch does not exist." };
//       return res.redirect("/admin-add-clients");
//     }

//     const packageExists = await Package.findById(packageId);
//     if (!packageExists) {
//       req.session.errors = { package: "Selected package does not exist." };
//       return res.redirect("/admin-add-clients");
//     }

//     // 🔹 Generate password from name + phone
//     const firstFour = name.substring(0, 4);
//     const lastFour = phone.slice(-4);
//     const rawPassword = firstFour + lastFour;
//     const hashedPassword = await bcrypt.hash(rawPassword, 10);

//     // Step 1️⃣ Create User entry
//     const newUser = new User({
//       name,
//       email,
//       phone,
//       password: hashedPassword,
//       userType: "client"
//     });
//     const savedUser = await newUser.save();

//     // Step 2️⃣ Upload image to S3 (only if file exists)
//     let imgUrl = null;
//     if (req.file) {
//       imgUrl = await uploadFileToS3(req.file, "clients");
//     }

//     // Step 3️⃣ Create ClientDetails
//     const clientDetails = new ClientDetails({
//       clientId: savedUser._id,
//       trainerId: trainer,
//       branch,
//       gender,
//       age,
//       altphone: altphone || null,
//       height: height || null,
//       weight: weight || null,
//       img: imgUrl
//     });
//     await clientDetails.save();

//     // Step 4️⃣ Normalize inputs
//     const isConfirmed = confirmedPayment === true || confirmedPayment === "true";

//     // Payment fields
//     let paymentStatus = "Pending";
//     let paidDate = null;
//     let expiredDate = null;

//     if (isConfirmed) {
//       paymentStatus = "Completed";
//       paidDate = new Date();
//       expiredDate = new Date(paidDate);
//       expiredDate.setDate(paidDate.getDate() + packageExists.durationInDays);
//     }

//     // Step 5️⃣ Save Membership
//     const newMembership = new Membership({
//       clientId: savedUser._id,
//       package: packageExists._id,
//       price: packageExists.price,
//       paymentMethod,
//       paymentStatus,
//       confirmedPayment: isConfirmed,
//       paidDate,
//       expiredDate,
//       status: "Active"
//     });

//     await newMembership.save();

//     // ✅ If UPI → call paymentController
//     if (paymentMethod.toLowerCase() === "upi") {
//       return res.redirect(
//         `/payment/create-order?clientId=${savedUser._id}&packageId=${packageExists._id}`
//       );
//     }

//     // ✅ Success response
//     req.session.success = "Client & Membership added successfully.";
//     return res.redirect("/admin-clients-list");

//   } catch (err) {
//     console.error("❌ Error adding client:", err);
//     req.session.errors = { server: "Something went wrong while adding the client." };
//     return res.redirect("/admin-add-clients");
//   }
// };


exports.checkClientPhone = async (req, res) => {
  try {
    console.log(req.query);
    
    const { phone } = req.query;

    const exists = await User.findOne({ phone, userType: "client" });

    if (exists) {
      return res.json({ success: false, message: "Phone number already exists" });
    }

    // If phone does not exist, just send success true with no message
    return res.json({ success: true });
  } catch (error) {
    console.error("Error checking phone:", error);
    return res.json({ success: false, message: "Server error" });
  }
}

// ✅ Check Email
exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || !email.trim()) {
      return res.json({ exists: false });
    }

    const emailExists = await User.findOne({ email: email.trim() }); // use your Client/User model
    return res.json({ exists: !!emailExists });
  } catch (err) {
    console.error("Error checking email:", err);
    return res.status(500).json({ exists: false });
  }
};

// ✅ Check Phone
exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone || !phone.trim()) {
      return res.json({ exists: false });
    }

    const phoneExists = await User.findOne({ phone: phone.trim() }); // use your Client/User model
    return res.json({ exists: !!phoneExists });
  } catch (err) {
    console.error("Error checking phone:", err);
    return res.status(500).json({ exists: false });
  }
};


// 🔹 Add new client + membership
exports.addClients = async (req, res) => {
  try {
    const {
      name, email, phone, altphone, gender, dob,
      branch, trainer, height, weight,
      package: packageId, paymentMethod, confirmedPayment
    } = req.body;
    
    const errors = {};

    // ✅ Email check
    const emailExists = await User.findOne({ email, userType: "client" });
    if (emailExists) {
      errors.email = "Email is already registered.";
    }

    // ✅ Phone check
    const phoneExists = await User.findOne({ phone, userType: "client" });
    if (phoneExists) {
      errors.phone = "Phone number is already registered.";
    }

    if (Object.keys(errors).length > 0) {
      return res.json({ success: false, errors });
    }

    // Ensure valid branch & package
    // Ensure valid branch & package
    const [branchExists, packageExists, trainerExists] = await Promise.all([
      Branch.findById(branch),
      Package.findById(packageId),
      User.findById(trainer) // 👈 fetch trainer details
    ]);

    // Generate default password: first 4 letters of name + last 4 digits of phone
    const rawPassword = `${name.substring(0, 4)}${phone.slice(-4)}`;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Create User
    const newUser = await User.create({
      name, email, phone,
      password: hashedPassword,
      userType: "client"
    });

    // Upload image (if exists)
    let imgUrl = null;
    if (req.file) imgUrl = await uploadFileToS3(req.file, "clients");

    // Create ClientDetails
    await ClientDetails.create({
      clientId: newUser._id,
      trainerId: trainer,
      branch,
      gender,
      dob,
      altphone: altphone || null,
      height: height || null,
      weight: weight || null,
      img: imgUrl
    });

    // Normalize payment confirmation
    const isConfirmed = confirmedPayment === true || confirmedPayment === "true";

    // Membership dates
    let paymentStatus = "Pending";
    let paidDate = null;
    let expiredDate = null;
    membershipStatus = "Pending";
    if (isConfirmed) {
      paymentStatus = "Completed";
      paidDate = new Date();
      expiredDate = new Date(paidDate);
      expiredDate.setDate(paidDate.getDate() + packageExists.durationInDays);
      membershipStatus = "Active";
    }

    // Create Membership
    const membership = await Membership.create({
      clientId: newUser._id,
      package: packageExists._id,
      price: packageExists.price,
      paymentMethod,
      paymentStatus,
      confirmedPayment: isConfirmed,
      paidDate,
      expiredDate,
      status: membershipStatus
    });

    // Create Payment
    const payment = await Payment.create({
      clientId: newUser._id,
      name: newUser.name,
      phone: newUser.phone,
      amount: packageExists.price,
      currency: "INR",
      paymentMethod,
      status: paymentStatus,
      confirmedPayment: isConfirmed,
      paymentDate: paidDate
    });

    // Inside addClients
    if (paymentMethod.toLowerCase() === "cash" && isConfirmed) {
      // First, send welcome message
      await sendWhatsAppMessage(phone, 
        `🎉 Welcome to our Gym, ${name}!\n\nWe’re excited to have you onboard. 💪\nYour selected package: ${packageExists.packageType}\nTrainer: ${trainerExists.name}\nBranch: ${branchExists.name}\nLet's achieve your fitness goals together! 🏋️‍♂️🔥`
      );

      // Then, send cash payment confirmation
      await sendWhatsAppMessage(phone,
        `✅ Payment Successful!\n\nHi ${name}, we’ve received your CASH payment for the package: ${packageExists.packageType}.\n📅 Start Date: ${paidDate.toDateString()}\n📅 Expiry Date: ${expiredDate.toDateString()}\nStay consistent and crush your fitness journey! 🔥`
      );

      return res.status(200).json({
        success: true,
        message: "Client & Membership added successfully. WhatsApp messages sent."
      });
    }

    // For online payment
    if (paymentMethod.toLowerCase() === "online") {
      // Send welcome message asynchronously
      sendWhatsAppMessage(phone,
        `🎉 Welcome to our Gym, ${name}!\n\nWe’re excited to have you onboard. 💪\nYour selected package: ${packageExists.packageType}\nTrainer: ${trainerExists.name}\nBranch: ${branchExists.name}\nLet's achieve your fitness goals together! 🏋️‍♂️🔥`
      );

      return res.redirect(`/payment/create-order?clientId=${newUser._id}&packageId=${packageExists._id}&paymentId=${payment._id}`);
    }

    // 🔹 Send WhatsApp message in background
    // (async () => {
    //   try {
    //     await clientTwilio.messages.create({
    //       from: "whatsapp:+14155238886",
    //       to: `whatsapp:+91${phone}`,
    //       body: `🎉 Welcome to our Gym, ${name}!\n\nWe’re excited to have you onboard. 💪\n\nYour selected package: ${packageExists.packageType}\nTrainer: ${trainerExists.name}\nBranch: ${branchExists.name}\n\nLet's achieve your fitness goals together! 🏋️‍♂️🔥`
    //     });

    //     if (paymentMethod.toLowerCase() === "cash" && isConfirmed) {
    //       await clientTwilio.messages.create({
    //         from: "whatsapp:+14155238886",
    //         to: `whatsapp:+91${phone}`,
    //         body: `✅ Payment Successful!\n\nHi ${name}, we’ve received your CASH payment for the package: ${packageExists.packageType}.\n\n📅 Start Date: ${paidDate.toDateString()}\n📅 Expiry Date: ${expiredDate.toDateString()}\n\nStay consistent and crush your fitness journey! 🔥`
    //       });
    //     }
    //   } catch (err) {
    //     console.error("⚠️ WhatsApp sending failed:", err.message);
    //   }
    // })();

    // if (paymentMethod.toLowerCase() === "online") {
    //   return res.redirect(
    //     `/payment/create-order?clientId=${newUser._id}&packageId=${packageExists._id}`
    //   );
    // } else {
    //   return res.status(200).json({
    //     success: true,
    //     message: "Client & Membership added successfully."
    //   });
    // }

  } catch (err) {
    console.error("❌ Error adding client:", err);
    req.session.errors = { server: "Something went wrong while adding the client." };
    return res.redirect("/admin-add-clients");
  }
};

exports.clientsList = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 2;
    let skip = (page - 1) * limit;

    let search = req.query.search || "";
    let branchId = req.query.branchId || "";

    // Match conditions
    let match = { isActive: true };

    if (branchId) {
      match.branch = new mongoose.Types.ObjectId(branchId);
    }

    // Build aggregation
    const pipeline = [
      { $match: match },

      // 🔹 Join User info (client)
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "clientInfo",
        },
      },
      { $unwind: "$clientInfo" },

      // 🔹 Apply search on clientInfo (name/phone only, no email)
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "clientInfo.name": { $regex: search, $options: "i" } },
                  { "clientInfo.phone": { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      // 🔹 Join branch info
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchInfo",
        },
      },
      { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },

      // 🔹 Join trainer info
      {
        $lookup: {
          from: "users",
          localField: "trainerId",
          foreignField: "_id",
          as: "trainerInfo",
        },
      },
      { $unwind: { path: "$trainerInfo", preserveNullAndEmptyArrays: true } },

      // 🔹 Join membership info (only need expiredDate, status)
      {
        $lookup: {
          from: "memberships",
          localField: "clientId",
          foreignField: "clientId",
          as: "membershipInfo",
        },
      },
      { $unwind: { path: "$membershipInfo", preserveNullAndEmptyArrays: true } },

      // 🔹 Project only needed fields
      {
        $project: {
          _id: 1,
          clientId: "$clientInfo._id",
          name: "$clientInfo.name",
          phone: "$clientInfo.phone",
          branch: "$branchInfo.name",
          trainer: "$trainerInfo.name",
          expiredDate: "$membershipInfo.expiredDate",
          status: "$membershipInfo.status",
        },
      },

      { $skip: skip },
      { $limit: limit },
    ];

    // Run aggregation
    const clients = await ClientDetails.aggregate(pipeline);

    // Count total (with same filters)
    const totalClients = await ClientDetails.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "clientInfo",
        },
      },
      { $unwind: "$clientInfo" },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "clientInfo.name": { $regex: search, $options: "i" } },
                  { "clientInfo.phone": { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),
      { $count: "count" },
    ]);

    const count = totalClients.length > 0 ? totalClients[0].count : 0;
    
    res.status(200).json({
      clients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("❌ Error fetching clients: ", error);
    res.status(500).json({ message: "Server Error" });
  }
};


exports.getClientsDetails = async (req, res) => {
  try {
    const clientId = req.params.id;

    const client = await ClientDetails.aggregate([
      { $match: { clientId: new mongoose.Types.ObjectId(clientId) } },

      // ✅ Join with User (client basic info)
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },

      // ✅ Join with Trainer (name, email, phone)
      {
        $lookup: {
          from: "users",
          localField: "trainerId",
          foreignField: "_id",
          as: "trainerInfo",
        },
      },
      { $unwind: { path: "$trainerInfo", preserveNullAndEmptyArrays: true } },

      // ✅ Join with Branch (name, id)
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchInfo",
        },
      },
      { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },

      // ✅ Join with Membership
      {
        $lookup: {
          from: "memberships",
          localField: "clientId",
          foreignField: "clientId",
          as: "membership",
        },
      },
      { $unwind: { path: "$membership", preserveNullAndEmptyArrays: true } },

      // ✅ Join with Package (inside Membership)
      {
        $lookup: {
          from: "packages",
          localField: "membership.package",
          foreignField: "_id",
          as: "packageInfo",
        },
      },
      { $unwind: { path: "$packageInfo", preserveNullAndEmptyArrays: true } },

      // ✅ Shape the response
      {
        $project: {
          _id: 1,
          altphone: 1,
          gender: 1,
          dob: 1,
          height: 1,
          weight: 1,
          img: 1,
          joinedDate: 1,

          "userInfo._id": 1,
          "userInfo.name": 1,
          "userInfo.email": 1,
          "userInfo.phone": 1,

          "trainerInfo._id": 1,
          "trainerInfo.name": 1,

          "branchInfo._id": 1,
          "branchInfo.name": 1,

          "membership._id": 1,
          "membership.paymentMethod": 1,
          "membership.paymentStatus": 1,
          "membership.confirmedPayment": 1,
          "membership.paidDate": 1,
          "membership.expiredDate": 1,
          "membership.status": 1,

          "packageInfo._id": 1,
          "packageInfo.name": 1,
          "packageInfo.price": 1,
          "packageInfo.days": 1,
        },
      },
    ]);

    if (!client.length) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    res.json({ success: true, data: client[0] });
  } catch (error) {
    console.error("❌ Error fetching client:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateClientDetails = async (req, res) => {
  try {
    console.log(req.params, req.body);
    
    const clientId = req.params.id;

    const {
      name, email, phone, altphone, gender, dob, branch, trainer, height, weight
    } = req.body;

    let errors = {};

    // ✅ Check unique email
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: clientId } });
      if (existingEmail) errors.email = "This email is already in use";
    }

    // ✅ Check unique phone
    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: clientId } });
      if (existingPhone) errors.phone = "This phone number is already registered";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Update User
    await User.findByIdAndUpdate(clientId, { name, email, phone });

    // Update ClientDetails
    const updateData = { altphone, gender, dob, branch, trainerId: trainer, height, weight };
    if (req.file) updateData.img = req.file.path;

    await ClientDetails.findOneAndUpdate({ clientId }, updateData);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Update membership route
// ✅ Update membership route
exports.updateMembership = async (req, res) => {
  try {
    const clientId = req.params.id;
    const { packageId, paymentMethod, confirmedPayment } = req.body;

    // --- Check package ---
    const packageExists = await Package.findById(packageId);
    if (!packageExists) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    // --- Check membership ---
    const membership = await Membership.findOne({ clientId }).populate("clientId");
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }

    // --- Update membership base details ---
    membership.package = packageId;
    membership.price = packageExists.price;
    membership.paymentMethod = paymentMethod;
    membership.status = "Pending";

    // Normalize confirmedPayment
    const isConfirmed = confirmedPayment === true || confirmedPayment === "true";

    let paidDate = null;
    let expiredDate = null;
    let membershipStatus = "Pending";
    let paymentStatus = "Pending";

    // --- CASH payment ---
    if (paymentMethod.toLowerCase() === "cash" && isConfirmed) {
      paidDate = new Date();
      expiredDate = new Date(paidDate);
      expiredDate.setDate(paidDate.getDate() + packageExists.durationInDays);
      membershipStatus = "Active";
      paymentStatus = "Completed";

      // Update Membership
      membership.paymentStatus = paymentStatus;
      membership.confirmedPayment = true;
      membership.paidDate = paidDate;
      membership.expiredDate = expiredDate;
      membership.status = membershipStatus;
      await membership.save();

      // ✅ Create NEW Payment every time
      const payment = await Payment.create({
        clientId,
        name: membership.clientId.name,
        phone: membership.clientId.phone,
        amount: packageExists.price,
        currency: "INR",
        paymentMethod: "Cash",
        status: paymentStatus,
        confirmedPayment: true,
        paymentDate: paidDate
      });

      // Send WhatsApp confirmation
      try {
        await sendWhatsAppMessage(
          membership.clientId.phone,
          `✅ Payment Successful!\nHi ${membership.clientId.name}, your CASH payment for ${packageExists.packageType} has been received.\nStart Date: ${paidDate.toDateString()}\nExpiry Date: ${expiredDate.toDateString()}`
        );
      } catch (err) {
        console.error("❌ WhatsApp send error:", err);
      }

      return res.json({ success: true, message: "Cash payment confirmed", membership, payment });
    }

    // --- ONLINE payment ---
    if (paymentMethod.toLowerCase() === "online") {
      membership.paymentStatus = "Pending";
      membership.confirmedPayment = false;
      membership.paidDate = null;
      membership.expiredDate = null;
      membership.status = "Pending";
      await membership.save();

      // ✅ Create NEW Payment every time
      const payment = await Payment.create({
        clientId,
        name: membership.clientId.name,
        phone: membership.clientId.phone,
        amount: packageExists.price,
        currency: "INR",
        paymentMethod: "Online",
        status: "Pending",
        confirmedPayment: false,
        paymentDate: null
      });

      // Redirect to Razorpay order creation
      return res.redirect(303, `/payment/create-order?clientId=${clientId}&packageId=${packageId}&paymentId=${payment._id}`);
    }

    // --- Fallback save ---
    await membership.save();
    return res.json({ success: true, message: "Membership updated", membership });
  } catch (error) {
    console.error("❌ Error updating membership:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


// exports.updateMembership = async (req, res) => {
//   try {
//     const clientId = req.params.id;
//     const { packageId, paymentMethod, confirmedPayment } = req.body;

//     // check package
//     const packageExists = await Package.findById(packageId);
//     if (!packageExists) {
//       return res.status(404).json({ success: false, message: "Package not found" });
//     }

//     // check membership
//     let membership = await Membership.findOne({ clientId }).populate("clientId");
//     if (!membership) {
//       return res.status(404).json({ success: false, message: "Membership not found" });
//     }

//     // update membership base details
//     membership.package = packageId;
//     membership.price = packageExists.price;
//     membership.paymentMethod = paymentMethod;
//     membership.status = "Pending";

//     // ✅ CASH payment handling
//     if (paymentMethod.toLowerCase() === "cash" && confirmedPayment) {
//       const paidDate = new Date();
//       const expiredDate = new Date(paidDate);
//       expiredDate.setDate(paidDate.getDate() + packageExists.durationInDays);

//       // Update Membership
//       membership.paymentStatus = "Completed";
//       membership.confirmedPayment = true;
//       membership.paidDate = paidDate;
//       membership.expiredDate = expiredDate;
//       membership.status = "Active";
//       await membership.save();

//       // Create NEW Payment
//       const payment = await Payment.create({
//         clientId,
//         name: membership.clientId.name,
//         phone: membership.clientId.phone,
//         amount: packageExists.price,
//         currency: "INR",
//         paymentMethod: "Cash",
//         status: "Completed",
//         confirmedPayment: true,
//         paymentDate: paidDate
//       });

//       // ✅ Send WhatsApp confirmation
//       try {
//         const phone = membership.clientId.phone;
//         const name = membership.clientId.name;

//         await sendWhatsAppMessage(phone,
//         `✅ Payment Successful!\nHi ${name}, we’ve received your CASH payment for the package: ${packageExists.packageType}.\nStart Date: ${paidDate.toDateString()}\nExpiry Date: ${expiredDate.toDateString()}`
//         );
//       } catch (whatsErr) {
//         console.error("❌ WhatsApp send error:", whatsErr);
//       }

//       return res.json({ success: true, message: "Cash payment confirmed", membership, payment });
//     }

//     // ✅ ONLINE (UPI) payment handling → Razorpay
//     if (paymentMethod.toLowerCase() === "online") {
//       // Update Membership
//       membership.paymentStatus = "Pending";
//       membership.confirmedPayment = false;
//       membership.paidDate = null;
//       membership.expiredDate = null;
//       membership.status = "Pending";
//       await membership.save();

//       // Create NEW Payment
//       const payment = await Payment.create({
//         clientId,
//         name: membership.clientId.name,
//         phone: membership.clientId.phone,
//         amount: packageExists.price,
//         currency: "INR",
//         paymentMethod: "Online",
//         status: "Pending",
//         confirmedPayment: false,
//         paymentDate: null
//       });

//       // Redirect to Razorpay
//       return res.redirect(303, `/payment/create-order?clientId=${clientId}&packageId=${packageId}`);
//     }

//     // fallback
//     await membership.save();

//     return res.json({ success: true, message: "Membership updated", membership, payment });

//   } catch (error) {
//     console.error("❌ Error updating membership:", error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };

exports.deleteClients = async (req, res) => {
  try {
    const clientId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }

    // Delete from ClientDetails
    await ClientDetails.deleteOne({ clientId });

    // Delete from Membership
    await Membership.deleteOne({ clientId });

    // Delete from User
    await User.deleteOne({ _id: clientId });

    res.json({ success: true, message: "Client deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

exports.getPackageList = async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 }); // Latest first
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


// exports.addPackages = async (req, res) => {
//   try {
//     const { packageType, durationInDays, price } = req.body;
//     // Validate required fields
//     if (!packageType || !price) {
//       return res.status(400).json({ success: false, message: "Duration and price are required." });
//     }

//     // Create and save new package
//     const newPackage = new Package({ packageType, durationInDays, price });
//     await newPackage.save();

//     res.status(201).json({
//       success: true,
//       message: "Package added successfully.",
//       package: newPackage
//     });
//   } catch (error) {
//     console.error("Error adding package:", error);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// };

exports.addPackages = async (req, res) => {
  try {
    const { packageType, durationInDays, price } = req.body;

    // Validate each field
    if (!packageType || packageType.trim() === "") {
      return res.status(400).json({ success: false, field: "packageType", message: "Package type is required." });
    }

    if (!durationInDays || durationInDays <= 0) {
      return res.status(400).json({ success: false, field: "durationInDays", message: "Duration must be greater than 0." });
    }

    if (!price || price < 0) {
      return res.status(400).json({ success: false, field: "price", message: "Price must be a positive number." });
    }

    // Check if package with same name already exists (optional)
    const existingPackage = await Package.findOne({ packageType: packageType.trim() });
    if (existingPackage) {
      return res.status(400).json({ success: false, field: "packageType", message: "Package type already exists." });
    }

    // Create and save new package
    const newPackage = new Package({
      packageType: packageType.trim(),
      durationInDays,
      price
    });
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

exports.getPackageDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const packageData = await Package.findById(id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found."
      });
    }

    res.json({
      success: true,
      package: packageData
    });
  } catch (error) {
    console.error("Error fetching package details:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params; // package id from URL
    const { packageType, durationInDays, price } = req.body;

    // Validate
    if (!packageType || !price || !durationInDays) {
      return res.status(400).json({
        success: false,
        message: "Package type, duration, and price are required."
      });
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      { packageType, durationInDays, price },
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ success: false, message: "Package not found." });
    }

    res.json({
      success: true,
      message: "Package updated successfully.",
      package: updatedPackage
    });
  } catch (error) {
    console.error("Error updating package:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      return res.status(404).json({ success: false, message: "Package not found." });
    }

    res.json({
      success: true,
      message: "Package deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting package:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

exports.getClientDetails = async (req, res) => {
  try {
    const clientId = new mongoose.Types.ObjectId(req.params.id);

    const clientData = await ClientDetails.aggregate([
      { $match: { clientId: clientId } },

      // Join with User (client basic info)
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "clientUser"
        }
      },
      { $unwind: "$clientUser" },

      // Join with Trainer (optional)
      {
        $lookup: {
          from: "users",
          localField: "trainerId",
          foreignField: "_id",
          as: "trainer"
        }
      },
      { $unwind: { path: "$trainer", preserveNullAndEmptyArrays: true } },

      // Join with Branch
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch"
        }
      },
      { $unwind: "$branch" },

      // Join with Membership
      {
        $lookup: {
          from: "memberships",
          localField: "clientId",
          foreignField: "clientId",
          as: "membership"
        }
      },

      // Pick latest membership
      {
        $addFields: {
          membership: {
            $arrayElemAt: [
              {
                $slice: [
                  {
                    $reverseArray: {
                      $sortArray: { input: "$membership", sortBy: { createdAt: 1 } }
                    }
                  },
                  1
                ]
              },
              0
            ]
          }
        }
      },

      // Join with Package inside membership
      {
        $lookup: {
          from: "packages",
          localField: "membership.package",
          foreignField: "_id",
          as: "package"
        }
      },
      { $unwind: { path: "$package", preserveNullAndEmptyArrays: true } },

      // Add calculated expiryDate if not set
      {
        $addFields: {
          "membership.expiredDate": {
            $ifNull: [
              "$membership.expiredDate",
              { $add: ["$membership.paidDate", { $multiply: ["$package.durationInDays", 24 * 60 * 60 * 1000] }] }
            ]
          }
        }
      },

      // Final Projection
      {
        $project: {
          _id: 0,
          clientId: "$clientUser._id",
          name: "$clientUser.name",
          email: "$clientUser.email",
          phone: "$clientUser.phone",
          gender: 1,
          dob: 1,
          altphone: 1,
          height: 1,
          weight: 1,
          joinedDate: 1,
          trainer: "$trainer.name",
          branch: "$branch.name",
          membership: {
            packageType: "$package.packageType",
            durationInDays: "$package.durationInDays",
            price: "$membership.price",
            paymentMethod: "$membership.paymentMethod",
            confirmedPayment: "$membership.confirmedPayment",
            paidDate: "$membership.paidDate",
            expiredDate: "$membership.expiredDate",
            status: "$membership.status"
          }
        }
      }
    ]);
    
    res.json({ success: true, data: clientData[0] || {} });
  } catch (err) {
    console.error("❌ Error in getClientDetails:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getPaymentList = async (req, res) => {
  try {
    let { page = 1, limit = 5, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Base filter for search
    const matchStage = {};
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    // Count total matching documents
    const total = await Payment.countDocuments(matchStage);
    const totalPages = Math.ceil(total / limit);

    // Fetch paginated data
    const payments = await Payment.find(matchStage)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name phone amount paymentMethod status razorpayPaymentId paymentDate createdAt");

    // Map the response to your frontend format
    const formattedPayments = payments.map(p => ({
      user: p.name,
      phone: p.phone,
      amount: p.amount,
      method: p.paymentMethod,
      status: p.status,
      paymentId: p.razorpayPaymentId 
        ? p.razorpayPaymentId 
        : (p.paymentMethod === "Cash" ? "Cash Payment" : "-"),
      paymentDate: p.paymentDate,
      createdAt: p.createdAt
    }));

    res.json({
      success: true,
      data: formattedPayments,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching payment details"
    });
  }
};

// Helper function to send WhatsApp message
async function sendWhatsAppMessage(phone, message) {
  try {
    await clientTwilio.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:+91${phone}`,
      body: message
    });
  } catch (err) {
    console.error("⚠️ WhatsApp sending failed:", err.message);
  }
}

exports.paymentStats = async (req, res) => {
  try {
    const { method, period } = req.query; // method=Cash|Online , period=monthly|yearly

    const match = {};
    if (method) match.paymentMethod = method;

    // group by month or year
    let groupStage;
    if (period === "yearly") {
      groupStage = {
        _id: { year: { $year: "$paymentDate" } },
        totalAmount: { $sum: "$amount" },
      };
    } else {
      groupStage = {
        _id: {
          year: { $year: "$paymentDate" },
          month: { $month: "$paymentDate" },
        },
        totalAmount: { $sum: "$amount" },
      };
    }

    const stats = await Payment.aggregate([
      { $match: match },
      { $group: groupStage },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

exports.downloadPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate("clientId");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payments");

    sheet.columns = [
      { header: "Client Name", key: "name", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Payment Method", key: "method", width: 15 },
      { header: "Amount", key: "amount", width: 10 },
      { header: "Status", key: "status", width: 12 },
      { header: "Date", key: "date", width: 20 },
    ];

    payments.forEach((p) => {
      sheet.addRow({
        name: p.name || (p.clientId && p.clientId.name),
        phone: p.phone || (p.clientId && p.clientId.phone),
        method: p.paymentMethod,
        amount: p.amount,
        status: p.status,
        date: p.paymentDate ? p.paymentDate.toLocaleDateString() : "-",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=payments.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating Excel file");
  }
}