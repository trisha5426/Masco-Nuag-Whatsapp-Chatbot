const express = require('express');
const router = express.Router();
const { handleMessage } = require('../controllers/chatbotController');

router.post('/', handleMessage);

module.exports = router;
app.post("/whatsapp", (req, res) => {
    console.log("🔥 WhatsApp webhook hit");
    console.log(req.body);

    res.sendStatus(200);
});