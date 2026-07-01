const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

// Email/password registration
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 12);
    const user = new User({
      spotifyId: `email_${Date.now()}`,
      displayName: username,
      email,
      passwordHash: hash,
      accessToken: 'none',
      refreshToken: 'none',
    });
    await user.save();

    const token = signToken(user._id);
    res.status(201).json({ token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Email/password login
router.post('/login', async (req, res) => {
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

// Spotify OAuth — initiates the flow (redirects to Spotify)
router.get('/spotify', passport.authenticate('spotify', {
  scope: [
    'user-read-email',
    'user-read-private',
    'user-top-read',
    'user-read-recently-played',
  ],
  showDialog: false,
}));

// Spotify OAuth callback — exchanges code for tokens, issues JWT, deep-links back to app
router.get('/spotify/callback',
  passport.authenticate('spotify', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const token = signToken(req.user._id);
    // Deep-link back to mobile app with JWT in URL fragment
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  }
);

module.exports = router;
