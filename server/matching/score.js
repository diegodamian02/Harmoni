'use strict';

const cfg = require('./config');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normName(name) {
  return name
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Two artist entries match if their mbids agree (when both present),
// otherwise fall back to normalizedName comparison.
function artistsMatch(a, b) {
  if (a.mbid && b.mbid) return a.mbid === b.mbid;
  const na = a.normalizedName ?? normName(a.name ?? '');
  const nb = b.normalizedName ?? normName(b.name ?? '');
  return na === nb && na.length > 0;
}

// ─── L1 — Direct artist overlap (rank + rarity weighted) ─────────────────────

function scoreL1(artistsA, artistsB) {
  // artistsA / artistsB: Array of { artistDoc, rank }
  // artistDoc: the populated Artist document from the artists cache
  let sum = 0;
  for (const { artistDoc: da, rank: ra } of artistsA) {
    for (const { artistDoc: db, rank: rb } of artistsB) {
      if (!artistsMatch(da, db)) continue;
      const rankWeight = ((5 - ra) / 4) * ((5 - rb) / 4);
      const listeners = da.listeners ?? db.listeners ?? cfg.MAX_LISTENERS;
      const rarityBoost = Math.min(
        2.0,
        1 + Math.log10(cfg.MAX_LISTENERS / Math.max(1, listeners))
      );
      sum += rankWeight * rarityBoost;
    }
  }
  return Math.min(1, sum / cfg.L1_NORM);
}

// ─── L2 — Similar-artist bridge (Last.fm graph) ──────────────────────────────

function edgesOneWay(fromArtists, toArtists) {
  const edges = [];
  for (const { artistDoc: fa } of fromArtists) {
    const similar = fa.similar ?? [];
    for (const { artistDoc: ta } of toArtists) {
      const edge = similar.find((s) => artistsMatch(s, ta));
      if (edge) edges.push(edge.match);
    }
  }
  return edges;
}

function scoreL2(artistsA, artistsB) {
  const edgesAB = edgesOneWay(artistsA, artistsB);
  const edgesBA = edgesOneWay(artistsB, artistsA);
  if (!edgesAB.length && !edgesBA.length) return 0;
  const meanAB = edgesAB.length ? edgesAB.reduce((s, v) => s + v, 0) / edgesAB.length : 0;
  const meanBA = edgesBA.length ? edgesBA.reduce((s, v) => s + v, 0) / edgesBA.length : 0;
  return (meanAB + meanBA) / 2;
}

// ─── L3 — Genre Jaccard ───────────────────────────────────────────────────────

function scoreL3(genresA, genresB) {
  if (!genresA.length || !genresB.length) return 0;
  const setA = new Set(genresA.map((g) => g.toLowerCase()));
  const setB = new Set(genresB.map((g) => g.toLowerCase()));
  const intersection = [...setA].filter((g) => setB.has(g)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

// ─── Music score (displayed to users) ────────────────────────────────────────

function musicScore(profileA, profileB) {
  const l1 = scoreL1(profileA.artists, profileB.artists);
  const l2 = scoreL2(profileA.artists, profileB.artists);
  const l3 = scoreL3(profileA.genres, profileB.genres);
  return Math.round(100 * (cfg.W_L1 * l1 + cfg.W_L2 * l2 + cfg.W_L3 * l3));
}

// ─── Ethnicity soft weight (ranking only, never shown) ───────────────────────

function ethnicityBoost(userA, userB) {
  const aOpen = !userA.ethnicityPreferences?.length;
  const bOpen = !userB.ethnicityPreferences?.length;

  // Either side has no preferences — they're open to all
  if (aOpen || bOpen) return cfg.ETHNICITY_OPEN_BOOST;

  const aLikesB = userA.ethnicityPreferences.includes(userB.ethnicity);
  const bLikesA = userB.ethnicityPreferences.includes(userA.ethnicity);

  if (aLikesB && bLikesA) return cfg.ETHNICITY_MUTUAL_BOOST;
  if (aLikesB || bLikesA) return cfg.ETHNICITY_ONEWAY_BOOST;
  return 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * score(profileA, profileB) → { music: number, rank: number }
 *
 * profileA / profileB shape:
 *   {
 *     genres:  string[],
 *     artists: [{ artistDoc: ArtistDocument, rank: number }],
 *     user:    UserDocument   // for ethnicity preferences
 *   }
 *
 * Returns:
 *   music — 0–100, shown to users
 *   rank  — music + ethnicity boost, used only for sorting the swipe queue
 */
function score(profileA, profileB) {
  const music = musicScore(profileA, profileB);
  const boost = ethnicityBoost(profileA.user, profileB.user);
  return { music, rank: music + boost };
}

module.exports = { score, scoreL1, scoreL2, scoreL3, musicScore, ethnicityBoost };
