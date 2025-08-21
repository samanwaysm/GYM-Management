// cron.js
const cron = require("node-cron");
const twilio = require("twilio");


const Membership = require("./model/clients/membership_schema");

const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

cron.schedule("*/1 * * * *", () => {
  console.log("⏰ Cron job running every 2 minutes!");
  // here you can put your membership expiry check + WhatsApp message
});

// 🔹 Run daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Running cron job for expired memberships");

  try {
    const expiredMemberships = await Membership.find({
      expiredDate: { $lte: new Date() },
      confirmedPayment: true
    }).populate("clientId");

    for (let membership of expiredMemberships) {
      console.log(`📌 Expired: ${membership.clientId.name}`);

      // Send WhatsApp message (no payment link, only login)
      await clientTwilio.messages.create({
        from: "whatsapp:+14155238886",
        to: `whatsapp:+91${membership.clientId.phone}`,
        body: `Hi ${membership.clientId.name}, your gym membership has expired. Please renew your membership by logging in here: ${process.env.APP_URL}/login`
      });

      // Update membership status
      membership.confirmedPayment = false;
      membership.paymentStatus = "Expired";
      await membership.save();
    }
  } catch (err) {
    console.error("❌ Cron job failed:", err.message);
  }
});
