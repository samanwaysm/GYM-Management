const Razorpay = require("razorpay");
const crypto = require("crypto");
const twilio = require("twilio");
const cron = require("node-cron");

const Payment = require("../../../model/payment/payment_schema");
const Membership = require("../../../model/clients/membership_schema");
const Package = require("../../../model/admin/package_schema")

const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔹 Step 1: Create Razorpay Payment Link
exports.createOrder = async (req, res) => {
  try {
    const { clientId, packageId } = req.query;

    const membership = await Membership.findOne({ clientId, package: packageId }).populate("clientId");
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
        membershipId: membership._id.toString()
      }
    });
    console.log(paymentLink);
    

    // Save Payment
    const newPayment = new Payment({
      clientId,
      membershipId: membership._id,
      amount: membership.price,
      razorpayOrderId: paymentLink.id, // store PaymentLink id
      status: "Pending"
    });
    await newPayment.save();

    // Send WhatsApp link via Twilio
    await clientTwilio.messages.create({
      from: "whatsapp:+14155238886", // Twilio sandbox
      to: `whatsapp:+91${membership.clientId.phone}`,
      body: `Hi ${membership.clientId.name}, please complete your gym membership payment using this link: ${paymentLink.short_url}`
    });

    // ✅ Redirect admin back to client list after sending message
    res.redirect("admin-clients-list");

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
      const paymentData = req.body.payload.payment.entity;
      const notes = req.body.payload.payment_link.entity.notes;
      console.log(notes);
      const package = await Package.findById({_id: notes.packageId});
      paidDate = new Date();
      expiredDate = new Date(paidDate);
      expiredDate.setDate(paidDate.getDate() + package.durationInDays);

      await Payment.findOneAndUpdate(
        { razorpayOrderId: req.body.payload.payment_link.entity.id },
        {
          razorpayPaymentId: paymentData.id,
          status: "Success",
          confirmedPayment: true,
          paidAt: new Date()
        }
      );



      await Membership.findOneAndUpdate(
        { _id: notes.membershipId },
        {
          paymentStatus: "Completed",
          confirmedPayment: true,
          paidDate,
          expiredDate
        }
      );

      console.log("✅ Payment updated successfully");
    }
  } else {
    console.log("❌ Invalid webhook signature");
  }

  res.json({ status: "ok" });
};

