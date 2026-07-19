'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { searchArtists, getArtistTopTracks, searchArtistSongs } = require('../services/music');

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests.' },
});

// GET /music/search?q=<query>
// Artist autocomplete. Debounce on client (≥3 chars, 300ms).
router.get('/search', requireAuth, searchLimiter, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 3) return res.json([]);

  try {
    const results = await searchArtists(q);
    res.json(results);
  } catch (err) {
    console.error('[music] search error:', err.message);
    res.status(502).json({ error: 'Music search unavailable.' });
  }
});

// GET /music/artist/:itunesId/tracks
// Top tracks for selected artist. Also triggers background MBID resolution.
router.get('/artist/:itunesId/tracks', requireAuth, async (req, res) => {
  const { itunesId } = req.params;
  if (!/^\d+$/.test(itunesId)) {
    return res.status(400).json({ error: 'Invalid itunesId.' });
  }

  try {
    const tracks = await getArtistTopTracks(itunesId);
    res.json(tracks);
  } catch (err) {
    console.error('[music] tracks error:', err.message);
    res.status(502).json({ error: 'Could not load tracks.' });
  }
});

// GET /music/artist/:itunesId/search?q=<song query>
// Live song search within a specific artist's iTunes catalog.
// Debounce on client (≥2 chars, 300ms).
router.get('/artist/:itunesId/search', requireAuth, searchLimiter, async (req, res) => {
  const { itunesId } = req.params;
  const q = (req.query.q || '').trim();
  if (!/^\d+$/.test(itunesId)) return res.status(400).json({ error: 'Invalid itunesId.' });
  if (q.length < 2) return res.json([]);

  try {
    const results = await searchArtistSongs(itunesId, q);
    res.json(results);
  } catch (err) {
    console.error('[music] song search error:', err.message);
    res.status(502).json({ error: 'Song search unavailable.' });
  }
});

module.exports = router;
