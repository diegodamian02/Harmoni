const express = require('express');
const router = express.Router();
const { getMatches, getMutualMatches, recordSwipe } = require('../controllers/matchController');
const { ensureAuth } = require('../utils/authMiddleware');

router.get('/', ensureAuth, getMatches);
router.get('/mutual', ensureAuth, getMutualMatches);
router.post('/swipe', ensureAuth, recordSwipe);

module.exports = router;
