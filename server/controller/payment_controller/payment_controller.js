const Razorpay = require("razorpay");
const crypto = require("crypto");
const twilio = require("twilio");

const Payment = require("../../../model/payment/payment_schema");
const Membership = require("../../../model/clients/membership_schema");
const Package = require("../../../model/admin/package_schema");
const { log } = require("console");

const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔹 Step 1: Create Razorpay Payment Link
exports.createOrder = async (req, res) => {
  try {
    const { clientId, packageId, paymentId } = req.query;
    
    const membership = await Membership.findOne({ clientId }).populate("clientId");
    if (!membership) return res.status(404).json({ success: false, error: "Membership not found" });
    
    // Create Payment Link
    const paymentLink = await razorpay.paymentLink.create({
      amount: membership.price * 100, // in paise
      currency: "INR",
      accept_partial: false,
      description: `Gym Membership Payment for ${membership.clientId.name}`,
      customer: {
        name: membership.clientId.name,
        email: membership.clientId.email,
        contact: `+91${membership.clientId.phone}`
      },
      notify: { sms: false, email: false },
      reminder_enable: true,
      notes: {
        clientId: clientId,
        packageId: packageId,
        membershipId: membership._id.toString(),
        paymentId 
      }
    });

    await Payment.findByIdAndUpdate(paymentId, { razorpayOrderId: paymentLink.id }, { new: true });  
    
 // 🔹 Send WhatsApp message in background
    sendWhatsAppMessage(
      membership.clientId.phone,
      `Hi ${membership.clientId.name}, please complete your gym membership payment using this link: ${paymentLink.short_url}`
    );

    // ✅ Send response to frontend with redirect URL
    res.status(200).json({
      success: true,
      message: "Payment link created & sent to client.",
      redirectUrl: "/admin-clients-list"
    });

   

    // // Send WhatsApp link via Twilio
    // await clientTwilio.messages.create({
    //   from: "whatsapp:+14155238886", // Twilio sandbox
    //   to: `whatsapp:+91${membership.clientId.phone}`,
    //   body: `Hi ${membership.clientId.name}, please complete your gym membership payment using this link: ${paymentLink.short_url}`
    // });

    // // ✅ Redirect admin back to client list after sending message
    // res.redirect("/admin-clients-list");

  } catch (err) {
    console.error("❌ Payment creation failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 🔹 Step 2: Verify Razorpay Webhook
exports.handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest === req.headers["x-razorpay-signature"]) {
    const event = req.body.event;

    if (event === "payment_link.paid") {
      try {
        const paymentData = req.body.payload.payment.entity;
        const paymentLink = req.body.payload.payment_link.entity;
        const notes = paymentLink.notes;
        const paymentId = notes.paymentId;

        const package = await Package.findById({ _id: notes.packageId });
        const membership = await Membership.findById(notes.membershipId).populate("clientId");

        const paidDate = new Date();
        const expiredDate = new Date(paidDate);
        expiredDate.setDate(paidDate.getDate() + package.durationInDays);

        // Update Payment record
        await Payment.findByIdAndUpdate(paymentId, {
          razorpayPaymentId: paymentData.id,
          status: "Completed",
          confirmedPayment: true,
          paidAt: new Date()
        });

        // Update Membership record
        await Membership.findOneAndUpdate(
          { _id: notes.membershipId },
          {
            paymentStatus: "Completed",
            confirmedPayment: true,
            paidDate,
            expiredDate,
            status: "Active"   // ✅ Activate after payment success
          }
        );

        await sendWhatsAppMessage(
        membership.clientId.phone,
        `Hi ${membership.clientId.name},  

✅ Your payment for the Gym Membership package (${package.packageType}) has been received successfully.  
📅 Start Date: ${paidDate.toDateString()}  
📅 Expiry Date: ${expiredDate.toDateString()}  

We’re excited to have you onboard. 💪`
      );
      } catch (err) {
        console.error("❌ Error in webhook handling:", err);
      }
    }
  } else {
    console.log("❌ Invalid webhook signature");
  }

  res.json({ status: "ok" });
};


// 🔹 Step 2: Verify Razorpay Webhook
// exports.handleWebhook = async (req, res) => {
//   const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
//   const shasum = crypto.createHmac("sha256", secret);
//   shasum.update(JSON.stringify(req.body));
//   const digest = shasum.digest("hex");

//   if (digest === req.headers["x-razorpay-signature"]) {
//     const event = req.body.event;

//     if (event === "payment_link.paid") {
//       const paymentData = req.body.payload.payment.entity;
//       const notes = req.body.payload.payment_link.entity.notes;
//       const package = await Package.findById({_id: notes.packageId});
//       paidDate = new Date();
//       expiredDate = new Date(paidDate);
//       expiredDate.setDate(paidDate.getDate() + package.durationInDays);

//       await Payment.findOneAndUpdate(
//         { razorpayOrderId: req.body.payload.payment_link.entity.id },
//         {
//           razorpayPaymentId: paymentData.id,
//           status: "Success",
//           confirmedPayment: true,
//           paidAt: new Date()
//         }
//       );



//       await Membership.findOneAndUpdate(
//         { _id: notes.membershipId },
//         {
//           paymentStatus: "Completed",
//           confirmedPayment: true,
//           paidDate,
//           expiredDate
//         }
//       );

//     }
//   } else {
//     console.log("❌ Invalid webhook signature");
//   }

//   res.json({ status: "ok" });
// };


// Client Side

// 🔹 Step 1: Create Razorpay Order
exports.updateMembership = async (req, res) => {
  try {
    clientId = req.session.userId
    const { packageId } = req.body;

    // ✅ Find membership for client
    const membership = await Membership.findOne({ clientId });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }

    // ✅ Get package details for price/duration
    const packageData = await Package.findById(packageId);
    if (!packageData) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    // ✅ Razorpay order options
    const options = {
      amount: packageData.price * 100, // convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        clientId: clientId,
        membershipId: membership._id.toString(),
        packageId: packageId
      }
    };

    // ✅ Create Razorpay order
    const order = await razorpay.orders.create(options);

    // ✅ Update existing Payment instead of creating new
    await Payment.findOneAndUpdate(
      { clientId }, 
      {
        razorpayOrderId: order.id,
        status: "Pending",        // keep pending until webhook confirms
        paymentMethod: "Online",  // set payment method
        confirmedPayment: false,
        paymentDate: null
      },
      { new: true }
    );

    // ✅ Return order details to frontend
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

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, membershipId, packageId } = req.body;

    // ✅ Check Package
    const packageData = await Package.findById(packageId);
    if (!packageData) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    // ✅ Verify Signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // ✅ Calculate Dates
    const paidDate = new Date();
    const expiredDate = new Date(paidDate);
    expiredDate.setDate(paidDate.getDate() + packageData.durationInDays);

    // ✅ Update Payment
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        status: "Completed",
        confirmedPayment: true,
        paymentDate: paidDate
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment record not found" });
    }

    // ✅ Update Membership
    const membership = await Membership.findByIdAndUpdate(
      { _id: membershipId },
      {
        paymentMethod: "Online",
        paymentStatus: "Completed",
        confirmedPayment: true,
        paidDate,
        expiredDate,
        status: "Active"
      },
      { new: true }
    ).populate("clientId");

    // ✅ Send WhatsApp Confirmation
    if (membership?.clientId) {
      const msg = `🎉 Welcome ${membership.clientId.name}!\n\n✅ Your payment for the Gym Membership package (${packageData.packageType}) has been received successfully.\n📅 Start Date: ${paidDate.toDateString()}\n📅 Expiry Date: ${expiredDate.toDateString()}\n\nWe’re excited to have you onboard. 💪`;
      sendWhatsAppMessage(membership.clientId.phone, msg);
    }

    res.json({ success: true, message: "Payment verified, membership updated & WhatsApp confirmation sent" });

  } catch (err) {
    console.error("❌ Verify Payment Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// Helper to send WhatsApp messages
async function sendWhatsAppMessage(phone, message) {
  try {
    await clientTwilio.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:+91${phone}`,
      body: message
    });
  } catch (err) {
    console.error("❌ WhatsApp sending failed:", err.message);
  }
}
