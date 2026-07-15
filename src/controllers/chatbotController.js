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

//     await saveSession(from, updatedSession);
//     await logChat(from, body, reply);

//     const twiml = new twilio.twiml.MessagingResponse();
//     // twiml.message(reply);
//     twiml.message("Hello from Twilio");

//     console.log("Sending:", twiml.toString());

//     res.type('text/xml');
//     res.send(twiml.toString());

//   } catch (err) {
//     console.error("Error:", err);
//     res.status(500).send('Internal Server Error');
//   }
// };
const express = require("express");
const router = express.Router();
const twilio = require("twilio");

router.post("/", (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message("Hello from Twilio!");

  res.set("Content-Type", "text/xml");
  res.status(200).send(twiml.toString());
});

module.exports = router;