const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'masco-nuag-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));  
  
app.use('/whatsapp', require('./routes/whatsapp')); 
app.use('/admin', require('./routes/admin'));
console.log("Registering root route...");

app.get('/', (req, res) => {
  const waNumber = (process.env.TWILIO_WHATSAPP_NUMBER || '14155238886').replace('whatsapp:+', '').replace('+', '');
  const waLink = 'https://wa.me/' + waNumber + '?text=Hi';
  const qrLink = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(waLink) + '&color=1A6B3C&bgcolor=ffffff';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MASCO NuAg - Farmer Support Chatbot</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0faf4;color:#1a1a1a}
.hero{background:linear-gradient(135deg,#1A6B3C 0%,#145230 60%,#0d3d24 100%);color:white;padding:60px 24px 80px;text-align:center}
.badge{display:inline-block;background:rgba(244,167,36,0.2);border:1px solid rgba(244,167,36,0.5);color:#F4A724;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:20px}
.hero h1{font-size:clamp(28px,5vw,52px);font-weight:800;line-height:1.15;margin-bottom:16px}
.hero h1 span{color:#F4A724}
.hero p{font-size:clamp(15px,2vw,18px);color:rgba(255,255,255,0.8);max-width:560px;margin:0 auto 36px;line-height:1.6}
.cta{display:inline-flex;align-items:center;gap:12px;background:#25D366;color:white;text-decoration:none;padding:16px 32px;border-radius:50px;font-size:18px;font-weight:700;box-shadow:0 8px 32px rgba(37,211,102,0.4);transition:all 0.3s;margin-bottom:16px}
.cta:hover{background:#20c35a;transform:translateY(-2px)}
.cta svg{width:26px;height:26px;fill:white}
.cta-sub{color:rgba(255,255,255,0.6);font-size:13px;margin-top:8px}
.stats{display:flex;justify-content:center;gap:40px;margin-top:48px;flex-wrap:wrap}
.stat-num{font-size:28px;font-weight:800;color:#F4A724}
.stat-label{font-size:12px;color:rgba(255,255,255,0.6);margin-top:2px}
.features{max-width:1100px;margin:-40px auto 0;padding:0 24px 60px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
.card{background:white;border-radius:16px;padding:28px 24px;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e8f5e9;transition:transform 0.2s,box-shadow 0.2s}
.card:hover{transform:translateY(-4px);box-shadow:0 8px 32px rgba(0,0,0,0.10)}
.icon{width:52px;height:52px;background:#E8F5E9;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:16px}
.card h3{font-size:16px;font-weight:700;color:#145230;margin-bottom:8px}
.card p{font-size:14px;color:#666;line-height:1.6}
.how{background:white;padding:60px 24px;text-align:center}
.how h2{font-size:28px;font-weight:800;color:#145230;margin-bottom:8px}
.how-sub{color:#666;font-size:15px;margin-bottom:48px}
.steps{display:flex;justify-content:center;max-width:800px;margin:0 auto;flex-wrap:wrap}
.step{flex:1;min-width:160px;padding:0 16px;position:relative;text-align:center}
.step:not(:last-child)::after{content:'→';position:absolute;right:-8px;top:24px;font-size:20px;color:#1A6B3C;font-weight:bold}
.circle{width:56px;height:56px;background:linear-gradient(135deg,#1A6B3C,#145230);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 14px;box-shadow:0 4px 16px rgba(26,107,60,0.3)}
.step h4{font-size:14px;font-weight:700;color:#145230;margin-bottom:6px}
.step p{font-size:13px;color:#888;line-height:1.5}
.qr-sec{background:linear-gradient(135deg,#E8F5E9,#f0faf4);padding:60px 24px;text-align:center;border-top:1px solid #d0edd0}
.qr-sec h2{font-size:26px;font-weight:800;color:#145230;margin-bottom:8px}
.qr-sec p{color:#666;font-size:15px;margin-bottom:32px}
.qr-box{display:inline-flex;flex-direction:column;align-items:center;background:white;padding:28px;border-radius:20px;box-shadow:0 8px 32px rgba(26,107,60,0.12);border:2px solid #d0edd0}
.qr-box img{width:180px;height:180px;border-radius:8px}
.qr-lbl{margin-top:14px;font-size:13px;color:#555;font-weight:500}
.or{font-size:15px;color:#999;margin:28px 0 20px;font-weight:500}
footer{background:#0d3d24;color:rgba(255,255,255,0.6);text-align:center;padding:24px;font-size:13px}
footer span{color:#F4A724}
@media(max-width:600px){.steps{flex-direction:column;align-items:center;gap:24px}.step::after{display:none}.stats{gap:24px}}
</style>
</head>
<body>

<div class="hero">
  <div class="badge">&#127807; Free Farmer Support &bull; 24/7</div>
  <h1>MASCO NuAg<br><span>Farmer Support</span> Chatbot</h1>
  <p>Get instant crop advice, product information, and expert support &mdash; directly on WhatsApp. No app download needed.</p>
  <a href="${waLink}" class="cta" target="_blank">
    <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    Chat on WhatsApp
  </a>
  <div class="cta-sub">Free &bull; No app download &bull; Works on any phone</div>
  <div class="stats">
    <div class="stat"><div class="stat-num">24/7</div><div class="stat-label">Always Available</div></div>
    <div class="stat"><div class="stat-num">5</div><div class="stat-label">Support Categories</div></div>
    <div class="stat"><div class="stat-num">10+</div><div class="stat-label">Crops Covered</div></div>
    <div class="stat"><div class="stat-num">Hindi</div><div class="stat-label">&amp; English Support</div></div>
  </div>
</div>

<div class="features">
  <div class="grid">
    <div class="card"><div class="icon">&#128230;</div><h3>Product Information</h3><p>Get instant details on any MASCO NuAg product &mdash; dosage, usage, composition, and safety precautions.</p></div>
    <div class="card"><div class="icon">&#127807;</div><h3>Crop Health Solution</h3><p>Diagnose crop problems and get tailored recommendations for pesticides, nutrition, and fungicides.</p></div>
    <div class="card"><div class="icon">&#128203;</div><h3>Complaint Registration</h3><p>Register product complaints instantly. Our team is notified in real time and will contact you within 48 hours.</p></div>
    <div class="card"><div class="icon">&#127978;</div><h3>Find Nearest Dealer</h3><p>Enter your pincode and instantly get a list of all authorized MASCO NuAg dealers in your state.</p></div>
  </div>
</div>

<div class="how">
  <h2>How It Works</h2>
  <p class="how-sub">Get support in 3 simple steps &mdash; no app download required</p>
  <div class="steps">
    <div class="step"><div class="circle">&#128241;</div><h4>Scan or Click</h4><p>Scan the QR code or click the WhatsApp button</p></div>
    <div class="step"><div class="circle">&#128172;</div><h4>Select Option</h4><p>Choose from the menu by replying with a number</p></div>
    <div class="step"><div class="circle">&#9989;</div><h4>Get Help</h4><p>Receive instant answers or connect with our team</p></div>
  </div>
</div>

<div class="qr-sec">
  <h2>Start a Conversation</h2>
  <p>Scan the QR code with your phone camera to open WhatsApp and start c  hatting instantly</p>
  <div class="qr-box">
    <img src="${qrLink}" alt="WhatsApp QR Code">
    <div class="qr-lbl">&#128247; Scan to open WhatsApp</div>
  </div>
  <div class="or">&mdash; or &mdash;</div>
  <a href="${waLink}" class="cta" target="_blank"> 
    <svg viewBox="0 0 24 24" style="width:22px;height:22px;fill:white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    Click to Open WhatsApp
  </a>
</div>

<footer>
  <p>&copy; 2026 <span>MASCO NuAg</span> &bull; WhatsApp Farmer Support Chatbot &bull; Available Mon&ndash;Sat, 9am&ndash;6pm IST</p>
  <p style="margin-top:6px">For urgent help call: <span>8796223211</span></p>
</footer>

</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Landing page: http://localhost:' + PORT);
  console.log('Admin dashboard: http://localhost:' + PORT + '/admin');
});