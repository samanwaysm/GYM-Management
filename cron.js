// cron.js
const cron = require("node-cron");
const twilio = require("twilio");


const Membership = require("./model/clients/membership_schema");

const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// // 🔹 Run daily at midnight
// cron.schedule("0 0 * * *", async () => {
//   console.log("⏰ Running cron job for expired memberships");

// cron.schedule("*/1 * * * *", async () => {
//   console.log("⏰ Cron job running every 1 minutes!");

cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Cron job running at 9:00 AM every day!");

  try {
    const expiredMemberships = await Membership.aggregate([
      {
        $match: {
          expiredDate: { $lte: new Date() },
          confirmedPayment: true
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "clientData"
        }
      },
      { $unwind: "$clientData" },
      {
        $match: {
          "clientData.userType": "client"
        }
      },
      {
        $project: {
          _id: 1,
          status: 1,
          paymentStatus: 1,
          confirmedPayment: 1,
          expiredDate: 1,
          "clientData._id": 1,
          "clientData.name": 1,
          "clientData.email": 1,
          "clientData.phone": 1
        }
      }
    ]);

    await Promise.all(
      expiredMemberships.map(async (membership) => {
        const client = membership.clientData;

        console.log(`📌 Expired: ${client.name} (${client.email})`);

        // ✅ Send WhatsApp message
        await clientTwilio.messages.create({
          from: "whatsapp:+14155238886",
          to: `whatsapp:+91${client.phone}`,
          body: `Hi ${client.name}, your gym membership has expired. Please renew your membership by logging in here: ${process.env.APP_URL}/login`
        });

        // ✅ Update membership status
        await Membership.updateOne(
          { _id: membership._id },
          {
            $set: {
              confirmedPayment: false,
              paymentStatus: "Pending",
              status: "Expired"
            }
          }
        );
      })
    );

    console.log("✅ All expired memberships processed successfully!");
  } catch (err) {
    console.error("❌ Cron job failed:", err.message);
  }

  // try {
  //   const expiredMemberships = await Membership.find({
  //     expiredDate: { $lte: new Date() },
  //     confirmedPayment: true
  //   }).populate("clientId");

  //   for (let membership of expiredMemberships) {
  //     console.log(`📌 Expired: ${membership.clientId.name}`);

  //     // Send WhatsApp message (no payment link, only login)
  //     await clientTwilio.messages.create({
  //       from: "whatsapp:+14155238886",
  //       to: `whatsapp:+91${membership.clientId.phone}`,
  //       body: `Hi ${membership.clientId.name}, your gym membership has expired. Please renew your membership by logging in here: ${process.env.APP_URL}/login`
  //     });

  //     // Update membership status
  //     membership.confirmedPayment = false;
  //     membership.paymentStatus = "Pending";
  //     membership.status = "Expired";

  //     await membership.save();
  //   }
  // } catch (err) {
  //   console.error("❌ Cron job failed:", err.message);
  // }
});
