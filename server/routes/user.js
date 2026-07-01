const express = require('express');
const router = express.Router();
const { getUserProfile, completeProfile, updateSpotifyData } = require('../controllers/userController');
const { ensureAuth } = require('../utils/authMiddleware');
const { upload } = require('../utils/cloudinary');

// GET current user profile
router.get('/profile', ensureAuth, getUserProfile);

// POST complete profile setup (name, age, gender, photos via Cloudinary)
router.post('/profile', ensureAuth, upload.array('photos', 6), completeProfile);

// POST update Spotify taste data
router.post('/spotify-data', ensureAuth, updateSpotifyData);

module.exports = router;
