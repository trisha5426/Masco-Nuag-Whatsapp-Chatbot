const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// ── Middleware: require login ──
function requireLogin(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  res.redirect('/admin/login');
}

// ── Login page ──
router.get('/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>MASCO NuAg Admin Login</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, Arial, sans-serif; background: #1A6B3C; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .box { background: white; padding: 40px; border-radius: 10px; width: 320px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        h1 { font-size: 20px; color: #145230; margin-bottom: 6px; }
        p { font-size: 13px; color: #666; margin-bottom: 24px; }
        input { width: 100%; padding: 12px; margin-bottom: 16px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
        button { width: 100%; padding: 12px; background: #1A6B3C; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; }
        button:hover { background: #145230; }
        .error { color: #C62828; font-size: 13px; margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>🌾 MASCO NuAg</h1>
        <p>Admin Dashboard Login</p>
        ${req.query.error ? '<div class="error">Incorrect password. Try again.</div>' : ''}
        <form method="POST" action="/admin/login">
          <input type="password" name="password" placeholder="Enter admin password" required autofocus>
          <button type="submit">Login</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

router.post('/login', express.urlencoded({ extended: false }), (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) {
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.redirect('/admin/login?error=1');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ── Protected dashboard ──
router.get('/', requireLogin, async (req, res) => {
  try {
    const complaintsSnap = await db.collection('complaints').orderBy('createdAt', 'desc').limit(100).get();
    const supportSnap = await db.collection('supportRequests').orderBy('createdAt', 'desc').limit(100).get();

    const complaints = complaintsSnap.docs.map(doc => doc.data());
    const supportRequests = supportSnap.docs.map(doc => doc.data());

    res.send(renderDashboard(complaints, supportRequests));
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).send('Error loading dashboard: ' + err.message);
  }
});

function fmtDate(ts) {
  if (!ts || !ts.toDate) return '-';
  return ts.toDate().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderDashboard(complaints, supportRequests) {
  const complaintRows = complaints.map(c => `
    <tr>
      <td>${esc(c.complaintId)}</td>
      <td>${esc(c.productName)}</td>
      <td><span class="badge">${esc(c.complaintType)}</span></td>
      <td>${esc(c.name)}</td>
      <td><a href="tel:${esc(c.mobile)}">${esc(c.mobile)}</a></td>
      <td>${esc(c.pincode)}</td>
      <td>${esc(c.purchaseDate)}</td>
      <td>${esc(c.billNumber)}</td>
      <td>${fmtDate(c.createdAt)}</td>
    </tr>
  `).join('');

  const supportRows = supportRequests.map(s => `
    <tr>
      <td>${esc(s.name)}</td>
      <td><a href="tel:${esc(s.mobile)}">${esc(s.mobile)}</a></td>
      <td>${esc(s.city)}</td>
      <td>${esc(s.comment)}</td>
      <td>${fmtDate(s.createdAt)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="30">
  <title>MASCO NuAg Admin Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Arial, sans-serif; background: #f4f6f5; color: #222; padding: 24px; }
    .header { background: #1A6B3C; color: white; padding: 20px 24px; border-radius: 8px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 22px; margin-bottom: 4px; }
    .header p { font-size: 13px; color: #d0edd0; }
    .logout { color: white; text-decoration: none; font-size: 13px; border: 1px solid rgba(255,255,255,0.4); padding: 6px 14px; border-radius: 6px; }
    .logout:hover { background: rgba(255,255,255,0.1); }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; border-radius: 8px; padding: 16px 20px; flex: 1; border-left: 4px solid #1A6B3C; }
    .stat-card .num { font-size: 28px; font-weight: bold; color: #1A6B3C; }
    .stat-card .label { font-size: 13px; color: #666; margin-top: 4px; }
    .section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 24px; overflow-x: auto; }
    .section h2 { font-size: 16px; color: #145230; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #E8F5E9; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #E8F5E9; color: #145230; text-align: left; padding: 10px 12px; font-weight: 600; white-space: nowrap; }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; white-space: nowrap; }
    tr:hover { background: #fafafa; }
    .badge { background: #FFF3E0; color: #E65100; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    a { color: #1565C0; text-decoration: none; }
    .empty { padding: 24px; text-align: center; color: #999; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>🌾 MASCO NuAg Admin Dashboard</h1>
      <p>Live complaint and support data from the WhatsApp chatbot · Auto-refreshes every 30s</p>
    </div>
    <a href="/admin/logout" class="logout">Logout</a>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="num">${complaints.length}</div>
      <div class="label">Total Complaints</div>
    </div>
    <div class="stat-card">
      <div class="num">${supportRequests.length}</div>
      <div class="label">Other Support Requests</div>
    </div>
  </div>

  <div class="section">
    <h2>📋 Product Complaints</h2>
    ${complaints.length ? `
    <table>
      <thead>
        <tr>
          <th>Complaint ID</th><th>Product</th><th>Type</th><th>Name</th>
          <th>Mobile</th><th>Pincode</th><th>Purchase Date</th><th>Bill No.</th><th>Submitted</th>
        </tr>
      </thead>
      <tbody>${complaintRows}</tbody>
    </table>
    ` : '<div class="empty">No complaints yet.</div>'}
  </div>

  <div class="section">
    <h2>💬 Other Support Requests</h2>
    ${supportRequests.length ? `
    <table>
      <thead>
        <tr><th>Name</th><th>Mobile</th><th>City</th><th>Comment</th><th>Submitted</th></tr>
      </thead>
      <tbody>${supportRows}</tbody>
    </table>
    ` : '<div class="empty">No support requests yet.</div>'}
  </div>
</body>
</html>
  `;
}

module.exports = router;