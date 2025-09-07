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

cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Cron job running at 9:00 AM every day!");

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
              paymentMethod: null,
              confirmedPayment: false,
              paymentStatus: "Pending",
              status: "Expired"
            }
          }
        );
      })
    );

    console.log("✅ All expired memberships processed successfully!");


    // --------------------- Birthday Wishes Check ---------------------
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // months are 0-based
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
          "clientData._id": 1,
          "clientData.name": 1,
          "clientData.email": 1,
          "clientData.phone": 1
        }
      }
    ]);

    await Promise.all(
      birthdayClients.map(async (clientDetail) => {
        const client = clientDetail.clientData;

        console.log(`🎉 Birthday: ${client.name} (${client.email})`);

        // ✅ Send WhatsApp Birthday WishF
        await clientTwilio.messages.create({
          from: "whatsapp:+14155238886",
          to: `whatsapp:+91${client.phone}`,
          body: `🎂 Happy Birthday ${client.name}! 🎉  
Wishing you a fantastic year ahead from all of us at ${process.env.APP_NAME}! 🏋️‍♂️`
        });
      })
    );

    console.log("✅ Birthday wishes sent successfully!");

  } catch (err) {
    console.error("❌ Cron job failed:", err.message);
  }
});
