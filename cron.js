// cron.js
const cron = require("node-cron");
const twilio = require("twilio");


const Membership = require("./model/clients/membership_schema");
const ClientDetails = require("./model/clients/ClientDetails_schema")


const clientTwilio = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// // 🔹 Run daily at midnight
// cron.schedule("0 0 * * *", async () => {
//   console.log("⏰ Running cron job for expired memberships");

// cron.schedule("*/1 * * * *", async () => {
//   console.log("⏰ Cron job running every 1 minutes!");

// Helper to send WhatsApp messages
async function sendWhatsAppMessage(phone, message) {
  try {
    await clientTwilio.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:+91${phone}`,
      body: message
    });
  } catch (err) {
    console.error(`❌ WhatsApp sending failed to ${phone}:`, err.message);
  }
}

// cron.schedule("0 9 * * *", async () => {
cron.schedule("*/1 * * * *", async () => {
  try {
    // --------------------- Expired Membership Check ---------------------
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
          as: "client"
        }
      },
      { $unwind: "$client" },
      { $match: { "client.userType": "client" } },
      {
        $project: {
          _id: 1,
          status: 1,
          paymentStatus: 1,
          confirmedPayment: 1,
          expiredDate: 1,
          "client._id": 1,
          "client.name": 1,
          "client.email": 1,
          "client.phone": 1
        }
      }
    ]);

    await Promise.all(
      expiredMemberships.map(async ({ _id, client }) => {

        // ✅ Send WhatsApp notification
        await sendWhatsAppMessage(
          client.phone,
          `Hi ${client.name}, your gym membership has expired. Please renew your membership here: ${process.env.APP_URL}/login`
        );

        // ✅ Update membership status
        await Membership.updateOne(
          { _id },
          {
            $set: {
              paymentMethod: null,
              confirmedPayment: false,
              paymentStatus: "Pending",
              status: "Expired"
            }
          }
        );
      })
    );


    // --------------------- Birthday Wishes Check ---------------------
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDate = today.getDate();

    const birthdayClients = await ClientDetails.aggregate([
      {
        $addFields: {
          dobMonth: { $month: "$dob" },
          dobDay: { $dayOfMonth: "$dob" }
        }
      },
      {
        $match: {
          dobMonth: todayMonth,
          dobDay: todayDate,
          isActive: true
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "clientId",
          foreignField: "_id",
          as: "client"
        }
      },
      { $unwind: "$client" },
      { $match: { "client.userType": "client" } },
      {
        $project: {
          "client._id": 1,
          "client.name": 1,
          "client.email": 1,
          "client.phone": 1
        }
      }
    ]);

    await Promise.all(
      birthdayClients.map(async ({ client }) => {

        await sendWhatsAppMessage(
          client.phone,
          `🎂 Happy Birthday ${client.name}! 🎉\nWishing you a fantastic year ahead from all of us at ${process.env.APP_NAME}! 🏋️‍♂️`
        );
      })
    );

  } catch (err) {
    console.error("❌ Cron job failed:", err.message);
  }
});
