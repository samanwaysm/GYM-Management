const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');
const Razorpay = require("razorpay");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const User = require("../../../model/clients/clients_schema")
const Membership = require("../../../model/clients/membership_schema")
const Package = require("../../../model/admin/package_schema")

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.user_login = async (req, res) => {
  try {
    const { email, password } = req.body;


    // ✅ Check if fields are empty
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // ✅ Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // ✅ Save session (no JWT)
    req.session.userId = user._id;
    console.log('hiiiiii loged');
    

    // ✅ Redirect to home/dashboard
    return res.redirect("/");  

    // return res.status(200).json({
    //   success: true,
    //   message: "Login successful",
    //   user: {
    //     id: user._id,
    //     name: user.name,
    //     email: user.email
    //   }
    // });

  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

exports.userDataFetch = async (req, res) => {
  try {
    const clientId = req.params.clientId; // userId from route

    const client = await User.findById(clientId)
      .populate("trainerId")
      .populate("branchId");

    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const membership = await Membership.findOne({ clientId });
    
    res.json({
      success: true,
      client,
      membership,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}


// 🔹 Step 1: Create Razorpay Order
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
    console.log(req.body);

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