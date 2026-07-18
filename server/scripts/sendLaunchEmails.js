require('dotenv').config();
const mongoose = require('mongoose');
const Waitlist = require('../models/Waitlist');
const { sendLaunchInvite } = require('../utils/mailer');

async function blast() {
  await mongoose.connect(process.env.MONGODB_URI);
  const entries = await Waitlist.find({});
  console.log(`Sending to ${entries.length} waitlist members...`);

  let sent = 0, failed = 0;
  for (const entry of entries) {
    try {
      await sendLaunchInvite(entry.email);
      console.log(`✓ ${entry.email}`);
      sent++;
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`✗ ${entry.email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone — ${sent} sent, ${failed} failed.`);
  await mongoose.disconnect();
}

blast();
