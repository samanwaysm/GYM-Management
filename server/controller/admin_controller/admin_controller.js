const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');

const User = require("../../../model/user/user_schema"); // import your new user schema
const OtpDb = require("../../../model/admin/otp_schema")
const Branch = require("../../../model/admin/branch_schema");
const Package = require("../../../model/admin/package_schema")
const TrainerDetails = require("../../../model/trainers/trainerDetails_schema");
const ClientDetails = require("../../../model/clients/ClientDetails_schema")
const Membership = require("../../../model/clients/membership_schema")

const { uploadFileToS3 } = require("../../services/s3_service/s3_service");


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
    // 1️⃣ SuperAdmin Login
    if (email === superAdmin.email) {
      if (password === superAdmin.password) {
        req.session.isSuperAdminAuthenticated = true;
        req.session.isAnyAdminAuthenticated = true;
        req.session.user = "superAdmin";
        return res.redirect("/admin-dashboard");
      } else {
        req.session.errors = { password: "Incorrect SuperAdmin password." };
        return res.redirect("/admin-login");
      }
    }

    // 2️⃣ Find User in DB
    const user = await User.findOne({ email, userType: { $in: ["admin", "trainer"] } });
    if (!user) {
      req.session.errors = { email: "No admin or trainer account found with this email." };
      return res.redirect("/admin-login");
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.session.errors = { password: "Incorrect password." };
      return res.redirect("/admin-login");
    }

    // 3️⃣ Handle login by role
    req.session.userId = user._id;
    req.session.user = user.name;

    if (user.userType === "admin") {
      req.session.isAdminAuthenticated = true;
      req.session.isAnyAdminAuthenticated = true;
      return res.redirect("/admin-dashboard");
    }

    if (user.userType === "trainer") {
      req.session.isTrainerAuthenticated = true;
      return res.redirect("/trainer-dashboard");
    }

    // ❌ Just in case
    req.session.errors = { loginError: "Invalid user role." };
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

    // ✅ Find user in single User schema
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    // ✅ Hash and save new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    user.password = hashedPassword;
    await user.save();

    // Optional: Flash success message
    req.session.success = `Password updated successfully.`;

    // Redirect to login (can be role-based if needed)
    return res.redirect("/admin-login"); // or "/login" for common login

  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error." });
  }
};


exports.addAdmin = async (req, res) => {
  const { name, email, phone } = req.body;
  const errors = {};

  // Validation
  if (!name || name.trim().length < 3) {
    errors.nameError = "Name must be at least 3 characters.";
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

  const firstFour = name.substring(0, 4);
  const lastFour = phone.slice(-4);
  const rawPassword = firstFour + lastFour;

  try {
    // Check for duplicates (email or phone)
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        errors.emailError = "User already exists with this email.";
      }
      if (existingUser.phone === phone) {
        errors.phoneError = "User already exists with this phone number.";
      }
    }

    if (Object.keys(errors).length > 0) {
      req.session.errors = errors;
      return res.redirect('/superadmin-add-admin');
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

    req.session.success = "Admin added successfully.";
    return res.redirect('/superadmin-admin-list');
  } catch (err) {
    console.error(err);
    req.session.errors = { signUpError: "An error occurred during signup." };
    res.redirect('/superadmin-add-admin');
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

exports.editAdmin = async (req, res) => {

}

exports.deleteAdmin = async (req, res) => {

}

exports.getAdminProfile = async (req, res) => {
  try {
    const userId = req.query.userId;

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
  console.log(req.body);
  
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

    // Check if trainer already exists
    const existingTrainer = await User.findOne({ email, userType: "trainer" });
    if (existingTrainer) {
      req.session.errors = ['Trainer with this email already exists'];
      return res.redirect('/admin-add-trainer');
    }

    // Generate password from name + phone
    const firstFour = name.substring(0, 4);
    const lastFour = phone.slice(-4);
    const rawPassword = firstFour + lastFour;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Step 1: Create trainer in User collection
    const newTrainer = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      userType: "trainer"
    });
    const savedTrainer = await newTrainer.save();

    // Step 2: Create trainer details (branch mapping)
    const trainerDetails = new TrainerDetails({
      trainerId: savedTrainer._id,
      branch
    });

    await trainerDetails.save();

    req.session.success = 'Trainer added successfully!';
    return res.redirect('/admin-trainers-list');

  } catch (error) {
    console.error('Error creating trainer:', error);
    res.status(500).send('Server error while adding trainer.');
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

    const totalTrainers = await TrainerDetails.countDocuments(match);

    const trainers = await TrainerDetails.aggregate([
      { $match: match },

      // Join with User collection
      {
        $lookup: {
          from: "users", // Mongo collection name (User -> users)
          localField: "trainerId",
          foreignField: "_id",
          as: "trainerInfo"
        }
      },
      { $unwind: "$trainerInfo" },

      // Search filter (applied on joined user data)
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

      // Join with Client collection
      {
        $lookup: {
          from: "clients",
          let: { trainerId: "$trainerId" },
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

      // Add count of clients
      {
        $addFields: {
          clientsCount: { $size: "$clientsHandled" }
        }
      },

      // Select final fields
      {
        $project: {
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

exports.addClients = async (req, res) => {
  try {
    const {
      name, email, phone, altphone, gender, age,
      branch, trainer, height, weight,
      package: packageId, paymentMethod,
      confirmedPayment
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
    const existingUser = await User.findOne({ email, userType: "client" });
    if (existingUser) {
      req.session.errors = { email: "Email is already registered." };
      return res.redirect("/admin-add-clients");
    }

    // 🔹 Ensure branch/package exist
    const branchExists = await Branch.findById(branch);
    if (!branchExists) {
      req.session.errors = { branch: "Selected branch does not exist." };
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

    // Step 1️⃣ Create User entry
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      userType: "client"
    });
    const savedUser = await newUser.save();

    // Step 2️⃣ Upload image to S3 (only if file exists)
    let imgUrl = null;
    if (req.file) {
      imgUrl = await uploadFileToS3(req.file, "clients");
    }

    // Step 3️⃣ Create ClientDetails
    const clientDetails = new ClientDetails({
      clientId: savedUser._id,
      trainerId: trainer,
      branch,
      gender,
      age,
      altphone: altphone || null,
      height: height || null,
      weight: weight || null,
      img: imgUrl
    });
    await clientDetails.save();

    // Step 4️⃣ Normalize inputs
    const isConfirmed = confirmedPayment === true || confirmedPayment === "true";

    // Payment fields
    let paymentStatus = "Pending";
    let paidDate = null;
    let expiredDate = null;

    if (isConfirmed) {
      paymentStatus = "Completed";
      paidDate = new Date();
      expiredDate = new Date(paidDate);
      expiredDate.setDate(paidDate.getDate() + packageExists.durationInDays);
    }

    // Step 5️⃣ Save Membership
    const newMembership = new Membership({
      clientId: savedUser._id,
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

    // ✅ If UPI → call paymentController
    if (paymentMethod.toLowerCase() === "upi") {
      return res.redirect(
        `/payment/create-order?clientId=${savedUser._id}&packageId=${packageExists._id}`
      );
    }

    // ✅ Success response
    req.session.success = "Client & Membership added successfully.";
    return res.redirect("/admin-clients-list");

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

      // 🔹 Apply search on clientInfo (name/email/phone)
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "clientInfo.name": { $regex: search, $options: "i" } },
                  { "clientInfo.email": { $regex: search, $options: "i" } },
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

      // 🔹 Join trainer info (User with userType = trainer)
      {
        $lookup: {
          from: "users",
          localField: "trainerId",
          foreignField: "_id",
          as: "trainerInfo",
        },
      },
      { $unwind: { path: "$trainerInfo", preserveNullAndEmptyArrays: true } },

      // 🔹 Project only needed fields
      {
        $project: {
          _id: 1,
          name: "$clientInfo.name",
          email: "$clientInfo.email",
          phone: "$clientInfo.phone",
          branch: "$branchInfo.name",
          trainer: "$trainerInfo.name",
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
                  { "clientInfo.email": { $regex: search, $options: "i" } },
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
