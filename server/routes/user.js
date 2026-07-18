const express = require('express');
const router = express.Router();
const { getUserProfile, completeProfile, saveBasicInfo, markProfileComplete, saveMusicGenres, updateSpotifyData } = require('../controllers/userController');
const { ensureAuth } = require('../utils/authMiddleware');
const { upload } = require('../utils/cloudinary');

// GET current user profile
router.get('/profile', ensureAuth, getUserProfile);

// POST complete profile setup (name, age, gender, photos via Cloudinary)
router.post('/profile', ensureAuth, upload.array('photos', 6), completeProfile);

// PATCH basic profile info (step 0–4 of onboarding)
router.patch('/basic-info', ensureAuth, saveBasicInfo);

// POST mark profile complete (dev only — remove before launch)
router.post('/profile/complete', ensureAuth, markProfileComplete);

// PATCH save genre selections (step 5 of onboarding)
router.patch('/music-genres', ensureAuth, saveMusicGenres);

// POST update Spotify taste data
router.post('/spotify-data', ensureAuth, updateSpotifyData);

module.exports = router;
