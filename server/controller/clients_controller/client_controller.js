const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// const User = require("../../../model/clients/ClientDetails_schema")
const User = require("../../../model/user/user_schema")
const Membership = require("../../../model/clients/membership_schema")
const Package = require("../../../model/admin/package_schema")
const ClientDetails = require("../../../model/clients/ClientDetails_schema")


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.user_login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const errors = {};

    // ✅ Validation
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";

    if (Object.keys(errors).length > 0) {
      req.session.errors = errors;
      return res.redirect("/login"); // redirect back to login page
    }

    // ✅ Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      req.session.errors = { email: "User not found" };
      return res.redirect("/login");
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.session.errors = { password: "Invalid password" };
      return res.redirect("/login");
    }

    // ✅ Check userType
    if (user.userType !== "client") {
      req.session.errors = { email: "Only clients can log in" };
      return res.redirect("/login");
    }

    // ✅ Save session (no JWT)
    req.session.userId = user._id;

    // ✅ Redirect to home/dashboard
    return res.redirect("/");

  } catch (err) {
    console.error("❌ Login Error:", err);
    req.session.errors = { server: "Something went wrong while logging in" };
    return res.redirect("/login");
  }
};

exports.userDataFetch = async (req, res) => {
  try {
    const clientId = new mongoose.Types.ObjectId(req.params.clientId);

    const clientData = await ClientDetails.aggregate([
      { $match: { clientId: clientId } },

      // Join with User (to get name, email, phone)
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },

      // Join with Branch
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchInfo"
        }
      },
      { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },

      // Join with Trainer
      {
        $lookup: {
          from: "users",
          localField: "trainerId",
          foreignField: "_id",
          as: "trainerInfo"
        }
      },
      { $unwind: { path: "$trainerInfo", preserveNullAndEmptyArrays: true } },

      // Join with Membership
      {
        $lookup: {
          from: "memberships",
          localField: "clientId",
          foreignField: "clientId",
          as: "membershipInfo"
        }
      },
      { $unwind: { path: "$membershipInfo", preserveNullAndEmptyArrays: true } },

      // Project only needed fields
      {
        $project: {
          _id: 0,
          name: "$userInfo.name",
          email: "$userInfo.email",
          phone: "$userInfo.phone",
          gender: 1,
          age: 1,
          height: 1,
          weight: 1,
          img: 1,
          branch: "$branchInfo.name",
          trainer: "$trainerInfo.name",
          joinedDate: 1,
          membership: {
            status: "$membershipInfo.status",
            expiredDate: "$membershipInfo.expiredDate",
            packageId: "$membershipInfo.packageId"
          }
        }
      }
    ]);

    if (!clientData || clientData.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    
    res.json({
      success: true,
      client: clientData[0]
    });

  } catch (err) {
    console.error("❌ Error fetching client data:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMembership = async (req, res) => {
  try {
    const { clientId, packageId } = req.body;

    // find membership for client
    const membership = await Membership.findOne({ clientId, package: packageId });
    if (!membership) return res.status(404).json({ success: false, message: "Membership not found" });

    const options = {
      amount: membership.price * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        clientId: clientId,
        membershipId: membership._id.toString()
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: options.amount,
      currency: options.currency,
      orderId: order.id,
      membershipId: membership._id,
      packageId: packageId 
    });

  } catch (err) {
    console.error("❌ Order Creation Failed:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 🔹 Step 2: Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, membershipId, packageId} = req.body;

    const package = await Package.findById(packageId);
    
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    paidDate = new Date();
    expiredDate = new Date(paidDate);
    expiredDate.setDate(paidDate.getDate() + package.durationInDays);

    // ✅ Update Membership
    await Membership.findByIdAndUpdate({_id: membershipId}, {
      paymentMethod : "UPI",
      paymentStatus: "Completed",
      confirmedPayment: true,
      paidDate,
      expiredDate,
      status: "Active"
    });

    res.json({ success: true, message: "Payment verified & membership updated" });

  } catch (err) {
    console.error("❌ Verify Payment Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
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
