const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Waitlist = require('../models/Waitlist');
const { sendWaitlistConfirmation } = require('../utils/mailer');

const waitlistLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.post('/', waitlistLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required.' });
  }

  try {
    await Waitlist.create({ email: email.toLowerCase().trim() });
  } catch (err) {
    if (err.code !== 11000) {
      console.error('Waitlist error:', err);
      return res.status(500).json({ error: 'Server error.' });
    }
    // Duplicate — fall through and still send the confirmation email
  }

  // Fire email async — don't block the response
  sendWaitlistConfirmation(email).catch((err) =>
    console.error('Waitlist email error:', err)
  );

  res.status(200).json({ ok: true });
});

module.exports = router;
