'use strict';

const https = require('https');
const PQueue = require('p-queue').default;
const Artist = require('../models/Artist');
const SearchCache = require('../models/SearchCache');

const MB_USER_AGENT = 'Harmoni/1.0 (https://harmoni.cc; contact@harmoni.cc)';
const LASTFM_KEY = process.env.LASTFM_API_KEY;
const TRACKS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// MusicBrainz: 1 req/sec hard limit — serial queue with 1050ms minimum gap
const mbQueue = new PQueue({ concurrency: 1, intervalCap: 1, interval: 1050 });

// ─── HTTP helper ────────────────────────────────────────────────────────────

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(new Error(`JSON parse error for ${url}: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => req.destroy(new Error(`Timeout: ${url}`)));
  });
}

// ─── Shared utilities ────────────────────────────────────────────────────────

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function swapArtwork(url) {
  if (!url) return null;
  return url.replace(/\d+x\d+bb\.jpg/, '600x600bb.jpg');
}

function stripHtml(str) {
  return str ? str.replace(/<[^>]+>/g, '').trim() : str;
}

function hasMbid(str) {
  return typeof str === 'string' && str.length > 0;
}

// ─── iTunes ─────────────────────────────────────────────────────────────────

async function searchArtists(rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  if (query.length < 3) return [];

  const cached = await SearchCache.findOne({ query });
  if (cached) return cached.results;

  // Fetch more than needed so dedup still yields up to 8 unique names
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=20`;
  const { status, body } = await fetchJson(url);
  if (status !== 200) throw new Error(`iTunes search ${status}`);

  // iTunes returns duplicate entries for the same artist (regional catalogs).
  // Deduplicate by lowercased name — keep the first occurrence.
  const seen = new Set();
  const results = (body.results || [])
    .filter((r) => {
      const key = r.artistName.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8)
    .map((r) => ({
      itunesId: String(r.artistId),
      name:     r.artistName,
    }));

  await SearchCache.findOneAndUpdate(
    { query },
    { query, results, fetchedAt: new Date() },
    { upsert: true }
  );

  return results;
}

async function getArtistTopTracks(itunesId) {
  const staleAfter = new Date(Date.now() - TRACKS_TTL_MS);
  const cached = await Artist.findOne({ itunesId });
  if (cached?.topTracks?.length && cached.fetchedAt > staleAfter) {
    // Trigger resolution in background if still unresolved
    if (!cached.mbid) resolveArtistBackground(itunesId, cached.name).catch(() => {});
    return cached.topTracks;
  }

  const url = `https://itunes.apple.com/lookup?id=${itunesId}&entity=song&limit=50`;
  const { status, body } = await fetchJson(url);
  if (status !== 200) throw new Error(`iTunes lookup ${status}`);

  const records = body.results || [];
  // results[0] is the artist record — skip it
  const artistRecord = records[0];
  const artistName = artistRecord?.artistName ?? cached?.name ?? 'Unknown';

  const tracks = records
    .slice(1)
    .filter((r) => r.isStreamable === true)
    .map((r) => ({
      itunesId:   String(r.trackId),
      name:       r.trackName,
      previewUrl: r.previewUrl || null,
      artworkUrl: swapArtwork(r.artworkUrl100),
    }));

  await Artist.findOneAndUpdate(
    { itunesId },
    {
      $set: {
        name:           artistName,
        normalizedName: normalizeName(artistName),
        itunesId,
        topTracks:      tracks,
        fetchedAt:      new Date(),
      },
      $setOnInsert: { genres: [], similar: [], listeners: null, mbid: null },
    },
    { upsert: true }
  );

  // Kick off background MBID + Last.fm resolution; never awaited
  resolveArtistBackground(itunesId, artistName).catch(() => {});

  return tracks;
}

// ─── MusicBrainz ─────────────────────────────────────────────────────────────

function mbFetch(path) {
  return mbQueue.add(() =>
    fetchJson(`https://musicbrainz.org/ws/2${path}`, {
      'User-Agent': MB_USER_AGENT,
      Accept: 'application/json',
    })
  );
}

async function resolveMBID(itunesId, name) {
  const existing = await Artist.findOne({ itunesId, mbid: { $ne: null } });
  if (existing?.mbid) return existing.mbid;

  const searchRes = await mbFetch(
    `/artist?query=${encodeURIComponent(name)}&limit=3&fmt=json`
  );
  if (searchRes.status === 503) return null; // rate-limit
  if (searchRes.status !== 200) return null;

  const best = (searchRes.body.artists || []).find((a) => (a.score ?? 0) >= 80);
  if (!best) return null;

  const mbid = best.id;

  // Second call: fetch controlled genres (requires separate MBID lookup)
  const detailRes = await mbFetch(`/artist/${mbid}?inc=genres+tags&fmt=json`);
  let genres = [];
  if (detailRes.status === 200) {
    const data = detailRes.body;
    genres = (data.genres || [])
      .filter((g) => g.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((g) => g.name);

    if (!genres.length) {
      genres = (data.tags || [])
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((t) => t.name);
    }
  }

  await Artist.findOneAndUpdate(
    { itunesId },
    { $set: { mbid, ...(genres.length ? { genres } : {}) } }
  );

  return mbid;
}

// ─── Last.fm ─────────────────────────────────────────────────────────────────

async function getLastfmSimilar(name, mbid) {
  const params = hasMbid(mbid)
    ? `mbid=${mbid}&autocorrect=1`
    : `artist=${encodeURIComponent(name)}&autocorrect=1`;

  const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getSimilar&${params}&limit=25&api_key=${LASTFM_KEY}&format=json`;
  const { status, body } = await fetchJson(url);
  if (status !== 200 || body.error) return [];

  return (body.similarartists?.artist || []).map((a) => ({
    mbid:           hasMbid(a.mbid) ? a.mbid : null,
    name:           a.name,
    normalizedName: normalizeName(a.name),
    match:          parseFloat(a.match) || 0,
  }));
}

async function getLastfmInfo(name, mbid) {
  const params = hasMbid(mbid)
    ? `mbid=${mbid}&autocorrect=1`
    : `artist=${encodeURIComponent(name)}&autocorrect=1`;

  const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo&${params}&api_key=${LASTFM_KEY}&format=json`;
  const { status, body } = await fetchJson(url);
  if (status !== 200 || body.error) return null;

  const info = body.artist;
  if (!info) return null;

  return {
    listeners: parseInt(info.stats?.listeners, 10) || null,
  };
}

// ─── Background resolution ───────────────────────────────────────────────────
// Runs after getArtistTopTracks. Never awaited in request path.

async function resolveArtistBackground(itunesId, name) {
  const mbid = await resolveMBID(itunesId, name);

  const [similar, info] = await Promise.all([
    getLastfmSimilar(name, mbid),
    getLastfmInfo(name, mbid),
  ]);

  const update = {};
  if (similar.length) update.similar = similar;
  if (info?.listeners != null) update.listeners = info.listeners;

  if (Object.keys(update).length) {
    await Artist.findOneAndUpdate({ itunesId }, { $set: update });
  }
}

// ─── Song search within an artist's catalog ──────────────────────────────────
// Combines artist name + query so iTunes returns relevant results,
// then filters to only tracks whose artistId matches.

async function searchArtistSongs(itunesId, query) {
  if (!query || query.trim().length < 2) return [];

  const artist = await Artist.findOne({ itunesId: String(itunesId) });
  const artistName = artist?.name ?? '';

  // Prepend artist name so iTunes scores the right catalog first
  const term = artistName ? `${artistName} ${query.trim()}` : query.trim();
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=50`;
  const { status, body } = await fetchJson(url);
  if (status !== 200) throw new Error(`iTunes search ${status}`);

  return (body.results || [])
    .filter((r) => String(r.artistId) === String(itunesId) && r.isStreamable === true)
    .slice(0, 20)
    .map((r) => ({
      itunesId:   String(r.trackId),
      name:       r.trackName,
      previewUrl: r.previewUrl || null,
      artworkUrl: swapArtwork(r.artworkUrl100),
    }));
}

module.exports = {
  searchArtists,
  getArtistTopTracks,
  resolveArtistBackground,
  searchArtistSongs,
};
