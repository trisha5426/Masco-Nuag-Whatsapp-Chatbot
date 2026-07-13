const { db } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

exports.getSession = async (phone) => {
  try {
    const doc = await db.collection('users').doc(phone).get();
    if (!doc.exists) return { currentStep: 'start', language: null, formData: {}, shownOutOfHours: false };

    const data = doc.data();
    const lastActive = data.lastActiveAt?.toDate();
    const now = new Date();
    const diffMins = lastActive ? (now - lastActive) / 60000 : 999;

    if (diffMins > 30) return { currentStep: 'start', language: null, formData: {}, shownOutOfHours: false };

    if (!data.formData) data.formData = {};

    return data;
  } catch (err) {
    console.error('getSession error:', err);
    return { currentStep: 'start', language: null, formData: {} };
  }
};

exports.saveSession = async (phone, session) => {
  try {
    await db.collection('users').doc(phone).set({
      ...session,
      phoneNumber: phone,
      lastActiveAt: FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.error('saveSession error:', err);
  }
};