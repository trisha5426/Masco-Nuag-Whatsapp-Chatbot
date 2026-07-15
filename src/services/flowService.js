const tree = require('../data/questionTree.json');
const { saveComplaint, saveSupportRequest } = require('../config/firebase');

exports.getNextResponse = async (input, session, phone) => {
  const i = (input || '').trim();
  const iLower = i.toLowerCase();
  let reply = '';
  let updatedSession = { ...session };

// ── Global commands ──
  if (iLower === 'restart' || iLower === 'hi' || iLower === 'hello' || !session.currentStep || session.currentStep === 'start') {
    updatedSession = { language: null, currentStep: 'lang', formData: {} };
    reply = tree.greet;
    return { reply, updatedSession };
  }

  // ── Business hours check ──
  // Only show out-of-hours message once per session at main menu
  // Bot still works 24/7 — just informs user team is offline
  if (!isBusinessHours() && step === 'main' && !session.shownOutOfHours) {
    updatedSession.shownOutOfHours = true;
    reply = getOutOfHoursMessage();
    return { reply, updatedSession };
  }
  if (isBusinessHours()) {
    updatedSession.shownOutOfHours = false;
  }

  if (iLower === '00') {
    updatedSession.currentStep = 'main';
    updatedSession.formData = {};
    const lang = session.language || 'english';
    function isBusinessHours() {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const IST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const day = IST.getUTCDay();   // 0=Sunday, 6=Saturday
  const hour = IST.getUTCHours();
  const isWeekday = day >= 1 && day <= 6; // Monday to Saturday
  const isOpenHour = hour >= 9 && hour < 18; // 9am to 6pm
  return isWeekday && isOpenHour;
}

function getOutOfHoursMessage() {
  const now = new Date();
  const IST = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const hour = IST.getUTCHours();
  const greeting = hour < 12 ? '🌅 Good Morning' : hour < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening';

  return `${greeting}!\n\n⏰ *Our support team is currently offline.*\n\n🕘 *Working Hours:*\nMonday to Saturday\n9:00 AM — 6:00 PM IST\n\n_Our automated chatbot is available 24/7 to help you instantly!_\n\nPlease select a category to continue:\n\n1️⃣ Product Information\n2️⃣ Product Complaint\n3️⃣ Crop Health Solution\n4️⃣ Nearest Dealer\n5️⃣ Other Support`;
}
    reply = buildMenu(tree[lang].main);
    return { reply, updatedSession };
  }

  // ── Language selection ──
  if (session.currentStep === 'lang') {
    if (i === '1') {
      updatedSession.language = 'english';
      updatedSession.currentStep = 'main';
      reply = buildMenu(tree.english.main);
    } else if (i === '2') {
      updatedSession.language = 'hindi';
      updatedSession.currentStep = 'main';
      reply = buildMenu(tree.hindi.main);
    } else {
      reply = 'Please reply 1 for English or 2 for Hindi.\n\n' + tree.greet;
    }
    return { reply, updatedSession };
  }

  const lang = session.language || 'english';
  const step = session.currentStep;

  // ── Main menu ──
  if (step === 'main') return handleMainMenu(i, updatedSession, lang);

  // ── PRODUCT INFORMATION ──
  if (step === 'productInfo_awaitName') return handleProductInfoName(i, updatedSession, lang);
  if (step === 'productInfo_subMenu')   return handleProductInfoSubMenu(i, updatedSession, lang);

  // ── PRODUCT COMPLAINT ──
  if (step === 'complaint_awaitProductName') return handleComplaintProductName(i, updatedSession, lang);
  if (step === 'complaint_awaitType')        return handleComplaintType(i, updatedSession, lang);
  if (step === 'complaint_awaitName') {
    updatedSession.formData.name = i;
    updatedSession.currentStep = 'complaint_awaitMobile';
    return { reply: 'Please enter your mobile number.', updatedSession };
  }
  if (step === 'complaint_awaitMobile') {
    updatedSession.formData.mobile = i;
    updatedSession.currentStep = 'complaint_awaitPincode';
    return { reply: 'Please enter the store pincode where you purchased the product.', updatedSession };
  }
  if (step === 'complaint_awaitPincode') {
    updatedSession.formData.pincode = i;
    updatedSession.currentStep = 'complaint_awaitDate';
    return { reply: 'Please enter the date of purchase (e.g. 10-June-2026).', updatedSession };
  }
  if (step === 'complaint_awaitDate') {
    updatedSession.formData.date = i;
    updatedSession.currentStep = 'complaint_awaitBillNo';
    return { reply: 'Please enter your bill number / receipt number.', updatedSession };
  }
  if (step === 'complaint_awaitBillNo') {
    updatedSession.formData.billNo = i;
    return await finishComplaint(phone, updatedSession, lang);
  }

  // ── CROP HEALTH ──
  if (step === 'cropHealth_mainMenu')      return handleCropHealthMenu(i, updatedSession, lang);
  if (step === 'cropHealth_protectionMenu') return handleCropProtectionMenu(i, updatedSession, lang);
  if (step === 'cropHealth_awaitCropName') return handleCropName(i, updatedSession, lang);
  if (step === 'cropHealth_awaitNextAction') return handleCropNextAction(i, updatedSession, lang);
  if (step === 'cropHealth_awaitPincode')  return handleDealerLookup(i, updatedSession, lang);

  // ── NEAREST DEALER ──
  if (step === 'dealer_awaitPincode') return handleDealerLookup(i, updatedSession, lang);

  // ── OTHER SUPPORT ──
  if (step === 'otherSupport_awaitName') {
    updatedSession.formData.name = i;
    updatedSession.currentStep = 'otherSupport_awaitMobile';
    return { reply: 'Please enter your mobile number.', updatedSession };
  }
  if (step === 'otherSupport_awaitMobile') {
    updatedSession.formData.mobile = i;
    updatedSession.currentStep = 'otherSupport_awaitCity';
    return { reply: 'Please enter your city.', updatedSession };
  }
  if (step === 'otherSupport_awaitCity') {
    updatedSession.formData.city = i;
    updatedSession.currentStep = 'otherSupport_awaitComment';
    return { reply: "Please enter your comment or query.\n(Type 'skip' to skip this step)", updatedSession };
  }
  if (step === 'otherSupport_awaitComment') {
    updatedSession.formData.comment = iLower === 'skip' ? '(no comment)' : i;
    return await finishOtherSupport(phone, updatedSession, lang);
  }

  // ── Fallback ──
  updatedSession.currentStep = 'main';
  updatedSession.formData = {};
  reply = buildMenu(tree[lang].main);
  return { reply, updatedSession };
};

// ═══════════════════════════════
// MAIN MENU
// ═══════════════════════════════
function handleMainMenu(i, session, lang) {
  let reply = '';
  if (i === '1') {
    session.currentStep = 'productInfo_awaitName';
    reply = 'Please type the name of the product you want information about.';
  } else if (i === '2') {
    session.currentStep = 'complaint_awaitProductName';
    session.formData = {};
    reply = 'Please type the name of the product you are complaining about.';
  } else if (i === '3') {
    session.currentStep = 'cropHealth_mainMenu';
    reply = 'Please select:\n\n1. Crop Nutrition\n2. Crop Deficiency\n3. Crop Protection\n\n0. Go back | 00. Main menu';
  } else if (i === '4') {
    session.currentStep = 'dealer_awaitPincode';
    reply = 'Please enter your pincode to find MASCO NuAg dealers in your state.';
  } else if (i === '5') {
    session.currentStep = 'otherSupport_awaitName';
    session.formData = {};
    reply = 'Please enter your full name.';
  } else {
    reply = 'Invalid option. Please reply with a number from the list.\n\n' + buildMenu(tree[lang].main);
  }
  return { reply, updatedSession: session };
}

// ═══════════════════════════════
// 1. PRODUCT INFORMATION
// ═══════════════════════════════
function handleProductInfoName(i, session, lang) {
  session.formData = { productName: i };
  session.currentStep = 'productInfo_subMenu';
  const reply = `You selected: ${i}\nPlease select what you need:\n\n1. About this product\n2. How to use (Usage)\n3. Dosage\n4. Precautions\n\n0. Go back | 00. Main menu`;
  return { reply, updatedSession: session };
}

function handleProductInfoSubMenu(i, session, lang) {
const { findProduct } = require('../utils/productSearch');

const product = findProduct(session.formData.productName);
  const map = { '1': 'about', '2': 'usage', '3': 'dosage', '4': 'precautions' };
  let reply = '';
  if (map[i]) {
    reply = `${product[map[i]]}\n\n---\nReply 0 to go back | 00 for Main Menu`;
  } else if (i === '0') {
    session.currentStep = 'productInfo_awaitName';
    reply = 'Please type the name of the product you want information about.';
    return { reply, updatedSession: session };
  } else {
    reply = 'Invalid option. Please reply 1, 2, 3, or 4.';
  }
  return { reply, updatedSession: session };
}

// ═══════════════════════════════
// 2. PRODUCT COMPLAINT
// ═══════════════════════════════
function handleComplaintProductName(i, session, lang) {
  session.formData = { productName: i };
  session.currentStep = 'complaint_awaitType';
  const reply = `Product: ${i}\nPlease select complaint type:\n\n1. Effectiveness issue (product not working)\n2. Damaged packaging\n3. Expired product\n4. Any other issue`;
  return { reply, updatedSession: session };
}

function handleComplaintType(i, session, lang) {
  const types = { '1': 'Effectiveness issue', '2': 'Damaged packaging', '3': 'Expired product', '4': 'Other issue' };
  if (!types[i]) return { reply: 'Invalid option. Please reply 1, 2, 3, or 4.', updatedSession: session };
  session.formData.complaintType = types[i];
  session.currentStep = 'complaint_awaitName';
  return { reply: 'Please enter your full name.', updatedSession: session };
}

async function finishComplaint(phone, session, lang) {
  const data = session.formData;
  await saveComplaint(phone, data);
  const reply = `✅ Thank you! Your complaint has been registered.\n\nWe will contact you within 24-48 hours.\n\nSummary:\n• Product: ${data.productName}\n• Type: ${data.complaintType}\n• Name: ${data.name}\n• Mobile: ${data.mobile}\n• Pincode: ${data.pincode}\n• Date: ${data.date}\n• Bill No: ${data.billNo}\n\nReply 00 for Main Menu`;
  session.currentStep = 'main';
  session.formData = {};
  return { reply, updatedSession: session };
}

// ═══════════════════════════════
// 3. CROP HEALTH SOLUTION
// ═══════════════════════════════
function handleCropHealthMenu(i, session, lang) {
  if (i === '1') {
    session.formData = { cropHealthType: 'nutrition' };
    session.currentStep = 'cropHealth_awaitCropName';
    return { reply: 'Please type the name of your crop.\n(e.g. Wheat, Rice, Cotton, Tomato)', updatedSession: session };
  } else if (i === '2') {
    session.formData = { cropHealthType: 'deficiency' };
    session.currentStep = 'cropHealth_awaitCropName';
    return { reply: 'Please type the name of your crop.\n(e.g. Wheat, Rice, Cotton, Tomato)', updatedSession: session };
  } else if (i === '3') {
    session.currentStep = 'cropHealth_protectionMenu';
    const reply = 'Please select protection type:\n\n1. Insecticides\n2. Weedicides\n3. Fungicides\n\n0. Go back | 00. Main menu';
    return { reply, updatedSession: session };
  } else if (i === '0') {
    session.currentStep = 'main';
    return { reply: buildMenu(tree[lang].main), updatedSession: session };
  } else {
    return { reply: 'Invalid option. Please reply 1, 2, or 3.\n\n1. Crop Nutrition\n2. Crop Deficiency\n3. Crop Protection', updatedSession: session };
  }
}

function handleCropProtectionMenu(i, session, lang) {
  const typeMap = { '1': 'insecticide', '2': 'weedicide', '3': 'fungicide' };
  if (typeMap[i]) {
    session.formData = { cropHealthType: typeMap[i] };
    session.currentStep = 'cropHealth_awaitCropName';
    return { reply: 'Please type the name of your crop.\n(e.g. Wheat, Rice, Cotton, Tomato)', updatedSession: session };
  } else if (i === '0') {
    session.currentStep = 'cropHealth_mainMenu';
    return { reply: 'Please select:\n\n1. Crop Nutrition\n2. Crop Deficiency\n3. Crop Protection\n\n0. Go back | 00. Main menu', updatedSession: session };
  } else {
    return { reply: 'Invalid option. Please reply 1, 2, or 3.\n\n1. Insecticides\n2. Weedicides\n3. Fungicides', updatedSession: session };
  }
}

function handleCropName(i, session, lang) {
  const cropKey = i.toLowerCase().trim();
  const crop = tree.crops[cropKey] || tree.crops.default;
  const type = session.formData.cropHealthType;
  const recommendation = crop[type];

  session.currentStep = 'cropHealth_awaitNextAction';
  const reply = `${recommendation}\n\nWhat would you like to do next?\n\n1. Call helpline\n2. Find dealers in your state`;
  return { reply, updatedSession: session };
}

function handleCropNextAction(i, session, lang) {
  if (i === '1') {
    session.currentStep = 'main';
    return { reply: '📞 MASCO NuAg Helpline: 8796223211\nAvailable: Mon-Sat, 9am to 6pm\n\nOur agronomist will guide you further.\n\nReply 00 for Main Menu', updatedSession: session };
  } else if (i === '2') {
    session.currentStep = 'cropHealth_awaitPincode';
    return { reply: 'Please enter your pincode to find dealers in your state.', updatedSession: session };
  } else {
    return { reply: 'Invalid option. Please reply 1 or 2.\n\n1. Call helpline\n2. Find dealers in your state', updatedSession: session };
  }
}

// ═══════════════════════════════
// 4. DEALER LOOKUP (shared)
// ═══════════════════════════════
function handleDealerLookup(i, session, lang) {
  const { getStateFromPincode } = require('../utils/pincodeHelper');
  const pincode = i.trim();
  const state = getStateFromPincode(pincode);

  if (!state) {
    session.currentStep = 'main';
    return {
      reply: `Sorry, we could not identify the state for pincode ${pincode}.\n\nPlease call our helpline:\n📞 8796223211\n\nReply 00 for Main Menu`,
      updatedSession: session
    };
  }

  const dealersByState = tree.dealers.states;
  const dealers = dealersByState[state] || dealersByState['default'];

  let reply = `🏪 MASCO NuAg Dealers in ${state}:\n(Pincode entered: ${pincode})\n\n`;
  dealers.forEach((dealer, index) => {
    reply += `${index + 1}. ${dealer.name}\n`;
    reply += `   📍 ${dealer.address}, ${dealer.city}\n`;
    reply += `   📞 ${dealer.phone}\n\n`;
  });

  if (!dealersByState[state]) {
    reply += `We are expanding to your area soon!\nFor now please call: 📞 8796223211`;
  } else {
    reply += `📞 MASCO NuAg Helpline: 8796223211`;
  }

  reply += '\n\nReply 00 for Main Menu';
  session.currentStep = 'main';
  return { reply, updatedSession: session };
}

// ═══════════════════════════════
// 5. OTHER SUPPORT
// ═══════════════════════════════
async function finishOtherSupport(phone, session, lang) {
  const data = session.formData;
  await saveSupportRequest(phone, data);
  const reply = `✅ Thank you for reaching out to MASCO NuAg! 🙏\n\nWe have received your details:\n• Name: ${data.name}\n• Mobile: ${data.mobile}\n• City: ${data.city}\n• Comment: ${data.comment}\n\nOur team will contact you within 24 hours.\n\nReply 00 for Main Menu`;
  session.currentStep = 'main';
  session.formData = {};
  return { reply, updatedSession: session };
}

// ═══════════════════════════════
// HELPERS
// ═══════════════════════════════
function buildMenu(node) {
  if (!node) return 'Something went wrong. Type restart to begin again.';
  let msg = node.prompt + '\n\n';
  Object.entries(node.options).forEach(([k, v]) => {
    msg += `${k}. ${v.label}\n`;
  });
  return msg;
}