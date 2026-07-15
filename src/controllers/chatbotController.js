// const twilio = require('twilio');
// const { getNextResponse } = require('../services/flowService');
// const { getSession, saveSession } = require('../utils/sessionManager');
// const { logChat } = require('../config/firebase');

// exports.handleMessage = async (req, res) => {
//   console.log("BODY:", req.body);

//   const from = req.body.From;
//   const body = (req.body.Body || '').trim();

//   try {
//     const session = await getSession(from);
//     console.log("Session:", session);

//     const { reply, updatedSession } =
//       await getNextResponse(body, session, from);

//     console.log("Reply:", reply);

//     const twiml = new twilio.twiml.MessagingResponse();
//     twiml.message(reply);

//     console.log("Sending:", twiml.toString());

// // Save data first
// await saveSession(from, updatedSession);
// await logChat(from, body, reply);

// // Then respond to Twilio
// res.type('text/xml');
// res.send(twiml.toString());

//   } catch (err) {
//     console.error("Error:", err);

//     const twiml = new twilio.twiml.MessagingResponse();
//     twiml.message("Sorry, something went wrong. Please try again.");

//     res.type('text/xml');
//     res.send(twiml.toString());
//   }
// };
const twilio = require('twilio');

exports.handleMessage = async (req, res) => {
    console.log("🔥 WEBHOOK HIT");
    console.log(req.body);

    const twiml = new twilio.twiml.MessagingResponse();

    twiml.message("Test reply from MASCO chatbot ✅");

    res.type("text/xml");
    res.send(twiml.toString());
};