const twilio = require('twilio');
const { getNextResponse } = require('../services/flowService');
const { getSession, saveSession } = require('../utils/sessionManager');
const { logChat } = require('../config/firebase');

exports.handleMessage = async (req, res) => {
  console.log("BODY:", req.body);

  const from = req.body.From;
  const body = (req.body.Body || '').trim();

  try {
    const session = await getSession(from);
    console.log("Session:", session);

    const { reply, updatedSession } =
      await getNextResponse(body, session, from);

    console.log("Reply:", reply);

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);

    console.log("Sending:", twiml.toString());

    // Send Twilio response first
    res.type('text/xml');
    res.send(twiml.toString());

    // Save data after responding
    await saveSession(from, updatedSession);
    await logChat(from, body, reply);

  } catch (err) {
    console.error("Error:", err);

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, something went wrong. Please try again.");

    res.type('text/xml');
    res.send(twiml.toString());
  }
};