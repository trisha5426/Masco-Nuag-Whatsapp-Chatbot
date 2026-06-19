const tree = require('../data/questionTree.json');
const { saveComplaint, saveSupportRequest } = require('../config/firebase');

exports.getNextResponse = async (input, session, phone) => {
  const i = (input || '').trim();
  const iLower = i.toLowerCase();
  let reply = '';
  let updatedSession = { ...session };

  // ── Global commands ──
  if (iLower === 'restart' || !session.currentStep || session.currentStep === 'start') {
    updatedSession = { language: null, currentStep: 'lang' };
    reply = tree.greet;
    return { reply, updatedSession };
  }

  if (iLower === '00') {
    updatedSession.currentStep = 'main';
    updatedSession.formData = {};
    reply = buildMenu(tree[session.language || 'english'].main);
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
  if (step === 'main') {
    return handleMainMenu(i, updatedSession, lang);
  }

  // ── PRODUCT INFORMATION FLOW ──
  if (step === 'productInfo_awaitName') {
    return handleProductInfoName(i, updatedSession, lang);
  }
  if (step === 'productInfo_subMenu') {
    return handleProductInfoSubMenu(i, updatedSession, lang);
  }

  // ── PRODUCT COMPLAINT FLOW ──
  if (step === 'complaint_awaitProductName') {
    return handleComplaintProductName(i, updatedSession, lang);
  }
  if (step === 'complaint_awaitType') {
    return handleComplaintType(i, updatedSession, lang);
  }
  if (step === 'complaint_awaitName') {
    updatedSession.formData.name = i;
    updatedSession.currentStep = 'complaint_awaitMobile';
    reply = 'Please enter your mobile number.';
    return { reply, updatedSession };
  }
  if (step === 'complaint_awaitMobile') {
    updatedSession.formData.mobile = i;
    updatedSession.currentStep = 'complaint_awaitPincode';
    reply = 'Please enter the store pincode where you purchased the product.';
    return { reply, updatedSession };
  }
  if (step === 'complaint_awaitPincode') {
    updatedSession.formData.pincode = i;
    updatedSession.currentStep = 'complaint_awaitDate';
    reply = 'Please enter the date of purchase (e.g. 10-June-2026).';
    return { reply, updatedSession };
  }
  if (step === 'complaint_awaitDate') {
    updatedSession.formData.date = i;
    updatedSession.currentStep = 'complaint_awaitBillNo';
    reply = 'Please enter your bill number / receipt number.';
    return { reply, updatedSession };
  }
  if (step === 'complaint_awaitBillNo') {
    updatedSession.formData.billNo = i;
    return await finishComplaint(phone, updatedSession, lang);
  }

  // ── CROP HEALTH FLOW ──
  if (step === 'cropHealth_awaitCropName') {
    return handleCropName(i, updatedSession, lang);
  }
  if (step === 'cropHealth_awaitType') {
    return handleCropType(i, updatedSession, lang);
  }
  if (step === 'cropHealth_awaitNextAction') {
    return handleCropNextAction(i, updatedSession, lang);
  }
  if (step === 'cropHealth_awaitPincode') {
    return handleDealerLookup(i, updatedSession, lang, 'cropHealth_done');
  }

  // ── NEAREST DEALER FLOW ──
  if (step === 'dealer_awaitPincode') {
    return handleDealerLookup(i, updatedSession, lang, 'dealer_done');
  }

  // ── OTHER SUPPORT FLOW ──
  if (step === 'otherSupport_awaitName') {
    updatedSession.formData.name = i;
    updatedSession.currentStep = 'otherSupport_awaitMobile';
    reply = 'Please enter your mobile number.';
    return { reply, updatedSession };
  }
  if (step === 'otherSupport_awaitMobile') {
    updatedSession.formData.mobile = i;
    updatedSession.currentStep = 'otherSupport_awaitCity';
    reply = 'Please enter your city.';
    return { reply, updatedSession };
  }
  if (step === 'otherSupport_awaitCity') {
    updatedSession.formData.city = i;
    updatedSession.currentStep = 'otherSupport_awaitComment';
    reply = "Please enter your comment or query (type 'skip' to skip this step).";
    return { reply, updatedSession };
  }
  if (step === 'otherSupport_awaitComment') {
    updatedSession.formData.comment = iLower === 'skip' ? '(no comment)' : i;
    return await finishOtherSupport(phone, updatedSession, lang);
  }

  // ── Fallback: unknown step, go to main menu ──
  updatedSession.currentStep = 'main';
  updatedSession.formData = {};
  reply = buildMenu(tree[lang].main);
  return { reply, updatedSession };
};

// ════════════════════════════════════════════
// MAIN MENU ROUTER
// ════════════════════════════════════════════
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
    session.currentStep = 'cropHealth_awaitCropName';
    reply = 'Please type the name of your crop.';
  } else if (i === '4') {
    session.currentStep = 'dealer_awaitPincode';
    reply = 'Please enter your pincode to find the nearest MASCO NuAg dealer.';
  } else if (i === '5') {
    session.currentStep = 'otherSupport_awaitName';
    session.formData = {};
    reply = 'Please enter your full name.';
  } else {
    reply = 'Invalid option. Please reply with a number from the list.\n\n' + buildMenu(tree[lang].main);
  }
  return { reply, updatedSession: session };
}

// ════════════════════════════════════════════
// 1. PRODUCT INFORMATION
// ════════════════════════════════════════════
function handleProductInfoName(i, session, lang) {
  session.formData = { productName: i };
  session.currentStep = 'productInfo_subMenu';
  const reply = `You selected: ${i}\nPlease select what you need:\n\n1. About this product\n2. How to use (Usage)\n3. Dosage\n4. Precautions\n\n0. Go back | 00. Main menu`;
  return { reply, updatedSession: session };
}

function handleProductInfoSubMenu(i, session, lang) {
  const productKey = (session.formData.productName || '').toLowerCase().trim();
  const product = tree.products[productKey] || tree.products.default;
  let reply = '';

  const map = { '1': 'about', '2': 'usage', '3': 'dosage', '4': 'precautions' };
  if (map[i]) {
    reply = `${product[map[i]]}\n\n---\nReply 0 to go back | 00 for Main Menu | restart to start over`;
  } else if (i === '0') {
    session.currentStep = 'productInfo_awaitName';
    reply = 'Please type the name of the product you want information about.';
    return { reply, updatedSession: session };
  } else {
    reply = 'Invalid option. Please reply 1, 2, 3, or 4.';
  }
  return { reply, updatedSession: session };
}

// ════════════════════════════════════════════
// 2. PRODUCT COMPLAINT
// ════════════════════════════════════════════
function handleComplaintProductName(i, session, lang) {
  session.formData = { productName: i };
  session.currentStep = 'complaint_awaitType';
  const reply = `Product: ${i}\nPlease select complaint type:\n\n1. Effectiveness issue (product not working)\n2. Damaged packaging\n3. Expired product\n4. Any other issue`;
  return { reply, updatedSession: session };
}

function handleComplaintType(i, session, lang) {
  const types = { '1': 'Effectiveness issue', '2': 'Damaged packaging', '3': 'Expired product', '4': 'Other issue' };
  if (!types[i]) {
    return { reply: 'Invalid option. Please reply 1, 2, 3, or 4.', updatedSession: session };
  }
  session.formData.complaintType = types[i];
  session.currentStep = 'complaint_awaitName';
  return { reply: 'Please enter your full name.', updatedSession: session };
}

async function finishComplaint(phone, session, lang) {
  const data = session.formData;
  await saveComplaint(phone, data);

  const reply = `Thank you! Your complaint has been registered successfully.\n\nWe will contact you within 24-48 hours.\n\nYour complaint summary:\n• Product: ${data.productName}\n• Type: ${data.complaintType}\n• Name: ${data.name}\n• Mobile: ${data.mobile}\n• Pincode: ${data.pincode}\n• Date: ${data.date}\n• Bill No: ${data.billNo}\n\nReply 00 for Main Menu`;

  session.currentStep = 'main';
  session.formData = {};
  return { reply, updatedSession: session };
}

// ════════════════════════════════════════════
// 3. CROP HEALTH SOLUTION
// ════════════════════════════════════════════
function handleCropName(i, session, lang) {
  session.formData = { cropName: i };
  session.currentStep = 'cropHealth_awaitType';
  const reply = `Crop: ${i}\nPlease select what you need:\n\n1. Pesticide recommendation\n2. Nutrition / Fertilizer recommendation`;
  return { reply, updatedSession: session };
}

function handleCropType(i, session, lang) {
  const cropKey = (session.formData.cropName || '').toLowerCase().trim();
  const crop = tree.crops[cropKey] || tree.crops.default;
  let suggestion = '';

  if (i === '1') suggestion = crop.pesticide;
  else if (i === '2') suggestion = crop.nutrition;
  else return { reply: 'Invalid option. Please reply 1 or 2.', updatedSession: session };

  session.currentStep = 'cropHealth_awaitNextAction';
  const reply = `${suggestion}\n\nWhat would you like to do next?\n\n1. Call helpline\n2. Find nearest dealer`;
  return { reply, updatedSession: session };
}

function handleCropNextAction(i, session, lang) {
  let reply = '';
  if (i === '1') {
    reply = '📞 MASCO NuAg Helpline: 1800-XXX-XXXX\nAvailable: Mon-Sat, 9am to 6pm\n\nOur agronomist will guide you on the right product and usage.\n\nReply 00 for Main Menu';
    session.currentStep = 'main';
  } else if (i === '2') {
    session.currentStep = 'cropHealth_awaitPincode';
    reply = 'Please enter your pincode to find the nearest dealer.';
  } else {
    reply = 'Invalid option. Please reply 1 or 2.';
  }
  return { reply, updatedSession: session };
}

// ════════════════════════════════════════════
// 4. NEAREST DEALER (shared by Crop Health path too)
// ════════════════════════════════════════════
function handleDealerLookup(i, session, lang, doneStep) {
  const pincode = i.trim();
  const dealer = tree.dealers[pincode] || tree.dealers.default;

  const reply = `Nearest MASCO NuAg Dealer to ${pincode}:\n\n🏪 Dealer Name: ${dealer.name}\n   Address: ${dealer.address}\n   📞 Contact: ${dealer.phone}\n\nReply 00 for Main Menu`;

  session.currentStep = 'main';
  return { reply, updatedSession: session };
}

// ════════════════════════════════════════════
// 5. OTHER SUPPORT
// ════════════════════════════════════════════
async function finishOtherSupport(phone, session, lang) {
  const data = session.formData;
  await saveSupportRequest(phone, data);

  const reply = `Thank you for reaching out to MASCO NuAg! 🙏\n\nWe have received your details:\n• Name: ${data.name}\n• Mobile: ${data.mobile}\n• City: ${data.city}\n• Comment: ${data.comment}\n\nOur team will contact you within 24 hours.\n\nReply 00 for Main Menu`;

  session.currentStep = 'main';
  session.formData = {};
  return { reply, updatedSession: session };
}

// ════════════════════════════════════════════
// MENU BUILDER HELPER
// ════════════════════════════════════════════
function buildMenu(node) {
  if (!node) return 'Something went wrong. Type restart to begin again.';
  let msg = node.prompt + '\n\n';
  Object.entries(node.options).forEach(([k, v]) => {
    msg += `${k}. ${v.label}\n`;
  });
  return msg;
}