const twilio = require('twilio');
const { getNextResponse } = require('../services/flowService');
const { getSession, saveSession } = require('../utils/sessionManager');
const { logChat } = require('../config/firebase');

exports.handleMessage = async (req, res) => {
  const from = req.body.From;
  const body = (req.body.Body || '').trim();

  try {
    const session = await getSession(from);
    const { reply, updatedSession } = await getNextResponse(body, session, from);
    await saveSession(from, updatedSession);
    await logChat(from, body, reply);

    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
};
