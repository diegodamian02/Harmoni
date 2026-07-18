const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const appleSignin = require('apple-signin-auth');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});

router.post('/register', authLimiter, async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 12);
    const user = new User({ displayName: username, email, passwordHash: hash });
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({ token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user._id);
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Apple Sign In
// Body: { identityToken, fullName? }
// Apple only sends name on the FIRST sign-in — store it then, ignore absence later
router.post('/apple', authLimiter, async (req, res) => {
  console.log('[Apple] request received');
  const { identityToken, fullName } = req.body;

  if (!identityToken) {
    console.log('[Apple] missing identityToken');
    return res.status(400).json({ error: 'identityToken required' });
  }
  console.log('[Apple] identityToken present, length:', identityToken.length);

  try {
    console.log('[Apple] verifying token with apple-signin-auth...');
    const appleUser = await appleSignin.verifyIdToken(identityToken, {
      audience: process.env.APPLE_BUNDLE_ID ?? 'com.diegodamian.harmoni',
      ignoreExpiration: false,
    });
    console.log('[Apple] token verified — sub:', appleUser.sub, 'email:', appleUser.email);

    const appleId = appleUser.sub;
    const email   = appleUser.email || null;

    let user = await User.findOne({ appleId });
    console.log('[Apple] existing user by appleId:', !!user);

    if (!user) {
      if (email) {
        user = await User.findOne({ email });
        console.log('[Apple] existing user by email:', !!user);
      }

      if (user) {
        user.appleId = appleId;
      } else {
        const displayName =
          fullName?.givenName
            ? `${fullName.givenName} ${fullName.familyName || ''}`.trim()
            : email?.split('@')[0] || 'Harmoni User';

        console.log('[Apple] creating new user, displayName:', displayName);
        user = new User({ displayName, email, appleId });
      }

      await user.save();
      console.log('[Apple] user saved, id:', user._id);
    }

    const token = signToken(user._id);
    console.log('[Apple] success — responding with token');
    res.json({ token, isNewUser: !user.profileComplete });
  } catch (err) {
    console.error('[Apple] error:', err.message);
    console.error('[Apple] full error:', err);
    res.status(401).json({ error: 'Invalid Apple token', detail: err.message });
  }
});

// Google Sign In
// Body: { idToken }
router.post('/google', authLimiter, async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken required' });

  try {
    const audience = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
    ].filter(Boolean);

    console.log('[Google] verifying token, accepted audiences:', audience);
    const ticket = await googleClient.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email    = payload.email || null;
    const name     = payload.name  || email?.split('@')[0] || 'Harmoni User';
    const picture  = payload.picture || null;

    let user = await User.findOne({ googleId });

    if (!user) {
      if (email) {
        user = await User.findOne({ email });
      }

      if (user) {
        user.googleId = googleId;
        if (picture && !user.profilePicture) user.profilePicture = picture;
      } else {
        user = new User({ displayName: name, email, googleId, profilePicture: picture });
      }

      await user.save();
    }

    const token = signToken(user._id);
    res.json({ token, isNewUser: !user.profileComplete });
  } catch (err) {
    console.error('[Google] token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid Google token', detail: err.message });
  }
});

module.exports = router;
