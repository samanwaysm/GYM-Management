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
    console.log(`✅ Client logged in: ${user.name}`);

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

    console.log(clientData);
    
    res.json({
      success: true,
      client: clientData[0]
    });

  } catch (err) {
    console.error("❌ Error fetching client data:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// exports.userDataFetch = async (req, res) => {
//   try {
//     const clientId = new mongoose.Types.ObjectId(req.params.clientId);

//     const clientData = await ClientDetails.aggregate([
//       { $match: { clientId: clientId } },

//       // Join with User (to get name, email, phone)
//       {
//         $lookup: {
//           from: "users",
//           localField: "clientId",
//           foreignField: "_id",
//           as: "userInfo"
//         }
//       },
//       { $unwind: "$userInfo" },

//       // Join with Branch
//       {
//         $lookup: {
//           from: "branches",
//           localField: "branch",
//           foreignField: "_id",
//           as: "branchInfo"
//         }
//       },
//       { $unwind: { path: "$branchInfo", preserveNullAndEmptyArrays: true } },

//       // Join with Trainer
//       {
//         $lookup: {
//           from: "users",
//           localField: "trainerId",
//           foreignField: "_id",
//           as: "trainerInfo"
//         }
//       },
//       { $unwind: { path: "$trainerInfo", preserveNullAndEmptyArrays: true } },

//       // Project only needed fields
//       {
//         $project: {
//           _id: 0,
//           name: "$userInfo.name",
//           email: "$userInfo.email",
//           phone: "$userInfo.phone",
//           gender: 1,
//           age: 1,
//           height: 1,
//           weight: 1,
//           img: 1,
//           branch: "$branchInfo.name",
//           trainer: "$trainerInfo.name",
//           joinedDate: 1
//         }
//       }
//     ]);

//     if (!clientData || clientData.length === 0) {
//       return res.status(404).json({ success: false, message: "Client not found" });
//     }

//     // 🔹 Membership lookup separately
//     const membership = await Membership.findOne({ clientId }).lean();

//     console.log(clientData,membership);
    

//     res.json({
//       success: true,
//       client: clientData[0],
//       membership
//     });
//   } catch (err) {
//     console.error("❌ Error fetching client data:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


// exports.userDataFetch = async (req, res) => {
//   try {
//     const clientId = req.params.clientId; // userId from route

//     const client = await User.findById(clientId)
//       .populate("trainerId")
//       .populate("branchId");

//     if (!client) {
//       return res.status(404).json({ success: false, message: "Client not found" });
//     }

//     const membership = await Membership.findOne({ clientId });
    
//     res.json({
//       success: true,
//       client,
//       membership,
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// }


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