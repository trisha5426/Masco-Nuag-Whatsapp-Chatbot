const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('../../serviceAccountKey.json');

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
exports.db = db;

// ── Chat logging (every message) ──
exports.logChat = async (phone, message, response) => {
  await db.collection('chats').add({
    phoneNumber: phone,
    incomingMessage: message,
    outgoingResponse: response,
    timestamp: FieldValue.serverTimestamp()
  });
};

// ── Product Complaint → saved for Admin Dashboard ──
exports.saveComplaint = async (phone, data) => {
  const complaintId = 'MN-' + Date.now();
  await db.collection('complaints').doc(complaintId).set({
    complaintId,
    phoneNumber: phone,
    productName: data.productName || '',
    complaintType: data.complaintType || '',
    name: data.name || '',
    mobile: data.mobile || '',
    pincode: data.pincode || '',
    purchaseDate: data.date || '',
    billNumber: data.billNo || '',
    status: 'open',
    createdAt: FieldValue.serverTimestamp()
  });
  return complaintId;
};

// ── Other Support → saved for Admin Dashboard ──
exports.saveSupportRequest = async (phone, data) => {
  await db.collection('supportRequests').add({
    phoneNumber: phone,
    name: data.name || '',
    mobile: data.mobile || '',
    city: data.city || '',
    comment: data.comment || '',
    status: 'open',
    createdAt: FieldValue.serverTimestamp()
  });
};