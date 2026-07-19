'use strict';

const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const User = require('../models/User');
const Artist = require('../models/Artist');
const { getArtistTopTracks } = require('../services/music');

// Curated genre list — exactly these strings are valid
const VALID_GENRES = [
  'Pop',
  'Hip-Hop / Rap',
  'R&B / Soul',
  'Rock',
  'Alternative',
  'Indie',
  'Electronic / EDM',
  'Dance / House',
  'Latin',
  'Country',
  'Folk / Acoustic',
  'Jazz',
  'Classical',
  'Metal',
  'Punk',
  'Reggae / Dancehall',
  'K-Pop',
  'Afrobeats',
  'Lo-Fi',
  'Ambient / Chill',
];

const VALID_ETHNICITIES = [
  'Asian',
  'Black / African American',
  'Hispanic / Latino',
  'Middle Eastern / North African',
  'Native American / Indigenous',
  'Pacific Islander',
  'South Asian',
  'White / Caucasian',
  'Mixed / Multiracial',
  'Prefer not to say',
];

// POST /onboarding/genres
// Body: { genres: [string, string, string] }
router.post('/genres', requireAuth, async (req, res) => {
  const { genres } = req.body;
  if (!Array.isArray(genres) || genres.length !== 3) {
    return res.status(400).json({ error: 'Exactly 3 genres required.' });
  }
  const invalid = genres.filter((g) => !VALID_GENRES.includes(g));
  if (invalid.length) {
    return res.status(400).json({ error: `Invalid genres: ${invalid.join(', ')}` });
  }

  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'musicProfile.genres': genres },
  });
  res.json({ ok: true });
});

// POST /onboarding/artists
// Body: { artists: [{ itunesId, name, rank }] }  — exactly 4, rank 1–4 unique
// Triggers background MBID + Last.fm resolution for each artist.
router.post('/artists', requireAuth, async (req, res) => {
  const { artists } = req.body;
  if (!Array.isArray(artists) || artists.length !== 4) {
    return res.status(400).json({ error: 'Exactly 4 artists required.' });
  }

  const ranks = artists.map((a) => a.rank);
  const validRanks = [1, 2, 3, 4];
  const hasAllRanks = validRanks.every((r) => ranks.includes(r));
  if (!hasAllRanks || new Set(ranks).size !== 4) {
    return res.status(400).json({ error: 'Artists must have unique ranks 1–4.' });
  }

  for (const a of artists) {
    if (!a.itunesId || !a.name) {
      return res.status(400).json({ error: 'Each artist needs itunesId and name.' });
    }
  }

  // Upsert each artist into cache and get their ObjectId
  const artistRefs = await Promise.all(
    artists.map(async ({ itunesId, name }) => {
      const doc = await Artist.findOneAndUpdate(
        { itunesId: String(itunesId) },
        {
          $setOnInsert: {
            name,
            normalizedName: Artist.normalizeName(name),
            itunesId: String(itunesId),
            genres: [],
            similar: [],
            listeners: null,
            mbid: null,
            fetchedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      return doc._id;
    })
  );

  const profileArtists = artists.map((a, i) => ({
    artistRef: artistRefs[i],
    rank: a.rank,
  }));

  await User.findByIdAndUpdate(req.user._id, {
    $set: { 'musicProfile.artists': profileArtists },
  });

  // Background: fetch top tracks + resolve MBID/Last.fm for each artist
  // Never awaited — user never waits for this
  for (const a of artists) {
    getArtistTopTracks(String(a.itunesId)).catch(() => {});
  }

  res.json({ ok: true });
});

// POST /onboarding/tracks
// Body: { tracks: [{ itunesId, name, previewUrl, artworkUrl, artistRank }] } — exactly 8
// Validation: exactly 2 tracks per artistRank (ranks 1–4 each get 2)
router.post('/tracks', requireAuth, async (req, res) => {
  const { tracks } = req.body;
  if (!Array.isArray(tracks) || tracks.length !== 8) {
    return res.status(400).json({ error: 'Exactly 8 tracks required.' });
  }

  for (const t of tracks) {
    if (!t.itunesId || !t.name || !t.artistRank) {
      return res.status(400).json({ error: 'Each track needs itunesId, name, and artistRank.' });
    }
    if (t.artistRank < 1 || t.artistRank > 4) {
      return res.status(400).json({ error: 'artistRank must be 1–4.' });
    }
  }

  const countsByRank = [1, 2, 3, 4].map(
    (r) => tracks.filter((t) => t.artistRank === r).length
  );
  if (countsByRank.some((c) => c !== 2)) {
    return res.status(400).json({ error: 'Exactly 2 tracks per artist rank required.' });
  }

  const profileTracks = tracks.map((t) => ({
    itunesId:   String(t.itunesId),
    name:       t.name,
    previewUrl: t.previewUrl || null,
    artworkUrl: t.artworkUrl || null,
    artistRank: t.artistRank,
  }));

  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      'musicProfile.tracks': profileTracks,
      'musicProfile.profileReady': true,
    },
  });

  res.json({ ok: true, profileReady: true });
});

// POST /onboarding/identity
// Body: { ethnicity?, ethnicityPreferences?, location?: { lat, lng }, maxDistance? }
// All fields optional — call whenever any of these change (onboarding or profile settings).
router.post('/identity', requireAuth, async (req, res) => {
  const { ethnicity, ethnicityPreferences, location, maxDistance } = req.body;
  const update = {};

  if (ethnicity !== undefined) {
    if (ethnicity !== null && !VALID_ETHNICITIES.includes(ethnicity)) {
      return res.status(400).json({ error: 'Invalid ethnicity value.' });
    }
    update.ethnicity = ethnicity;
  }

  if (ethnicityPreferences !== undefined) {
    if (!Array.isArray(ethnicityPreferences)) {
      return res.status(400).json({ error: 'ethnicityPreferences must be an array.' });
    }
    const invalid = ethnicityPreferences.filter((e) => !VALID_ETHNICITIES.includes(e));
    if (invalid.length) {
      return res.status(400).json({ error: `Invalid preference values: ${invalid.join(', ')}` });
    }
    update.ethnicityPreferences = ethnicityPreferences;
  }

  if (location !== undefined) {
    const { lat, lng } = location;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'location requires numeric lat and lng.' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinates.' });
    }
    update.location = { type: 'Point', coordinates: [lng, lat] };
  }

  if (maxDistance !== undefined) {
    if (typeof maxDistance !== 'number' || maxDistance < 1 || maxDistance > 500) {
      return res.status(400).json({ error: 'maxDistance must be 1–500 miles.' });
    }
    update.maxDistance = maxDistance;
  }

  if (!Object.keys(update).length) {
    return res.status(400).json({ error: 'No valid fields provided.' });
  }

  await User.findByIdAndUpdate(req.user._id, { $set: update });
  res.json({ ok: true });
});

// GET /onboarding/genres/list
// Returns the valid genre list for the mobile chip picker.
router.get('/genres/list', requireAuth, (req, res) => {
  res.json(VALID_GENRES);
});

// GET /onboarding/ethnicities/list
// Returns the valid ethnicity list for the mobile picker.
router.get('/ethnicities/list', requireAuth, (req, res) => {
  res.json(VALID_ETHNICITIES);
});

module.exports = router;
