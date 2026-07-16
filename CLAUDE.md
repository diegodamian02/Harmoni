# CLAUDE.md — Harmoni Project Context & Current Direction

> Drop this file in the repo root. It briefs Claude Code on the July 2026 pivot, the new architecture, and the build order. Treat this as the source of truth over any older Spotify-related code you find in the repo.

## What Harmoni is

A music-based dating app. Users build a taste profile (3 genres, 4 artists, 8 songs), get matched by a compatibility scoring algorithm, and each match generates a shared 8-track "blend" playlist that lives inside the app.

**Stack:** React Native/Expo (TypeScript, expo-router) mobile app · Express/Node.js server · MongoDB Atlas · Next.js landing page at harmoni.cc · Monorepo: `mobile/`, `server/`, `web/`.

**Team:** Diego (full-stack) + Virginia (UI/UX & motion design, works in Figma; her frames marked "Ready to build" are implemented as-specced).

## THE PIVOT (July 2026) — read this first

**Spotify is OUT.** Their Feb 2026 API changes (5-user dev cap, Premium requirement, 250k-MAU wall for extended quota, deprecated endpoints) made Spotify OAuth unviable as the app's backbone.

**Consequences for the codebase:**
- Remove/ignore all Spotify OAuth routes, env vars, and client code. Do not build new features on Spotify.
- Onboarding is now **manual, tap-based** — no OAuth required to use the app.
- Music data comes from three open APIs (below), all proxied through OUR server, never called from the mobile client.

## The new data stack

| API | Used for | Constraints |
| --- | --- | --- |
| **iTunes Search API** (`itunes.apple.com`) | Artist/song autocomplete, artist top-tracks grid, cover art (`artworkUrl100`, swap `100x100`→`600x600` for hi-res), 30-sec `previewUrl` clips | No auth. **~20 req/min per IP** (429 on exceed) — server-side caching is mandatory. `previewUrl` is optional on some tracks: handle absence. |
| **MusicBrainz** (`musicbrainz.org/ws/2`, `&fmt=json`) | Canonical artist IDs (MBIDs) + genre tags. Normalization layer. | **1 req/sec** — single queued worker (p-queue, concurrency 1, ~1100ms interval). MUST send User-Agent: `Harmoni/1.0 (https://harmoni.cc; contact@harmoni.cc)`. Cache results permanently. |
| **Last.fm** (`ws.audioscrobbler.com/2.0`) | `artist.getSimilar` (similarity edges with 0–1 `match` scores), `artist.getInfo` (listener counts for rarity weighting), optional `user.getTopArtists/TopTracks` import (username only, no OAuth) | Free API key in env (`LASTFM_API_KEY`). Accepts `mbid` param. **KNOWN ISSUE: mbid fields in responses are often EMPTY** — always store and match on normalized name as fallback. |

## Canonical data model

MBID is the canonical join key. Every artist stores all three ID spaces.

```js
// artists collection — shared cache all three APIs feed into
{
  _id, name,                 // MusicBrainz canonical name when resolved
  normalizedName,            // lowercase, punctuation stripped, leading "the" removed
  mbid,                      // nullable if unresolved
  itunesId,
  genres: [String],          // MusicBrainz genres; fallback iTunes primaryGenreName
  listeners,                 // Last.fm listener count (rarity weighting)
  similar: [{ mbid, name, normalizedName, match }],  // Last.fm top ~25
  topTracks: [{ itunesId, name, previewUrl, artworkUrl }],
  fetchedAt
}

// user.musicProfile
{
  genres:  [String],                        // exactly 3, from curated ~20-chip list
  artists: [{ artistRef, rank }],           // exactly 4, rank 1–4
  tracks:  [{ itunesId, name, previewUrl, artworkUrl, artistRank }],  // exactly 8 (2/artist)
  lastfmUsername,                           // optional
  profileReady: Boolean                     // true once background resolution completes
}
```

## Onboarding pipeline

```
User types artist name → iTunes /search (server-proxied, cached, debounced ≥3 chars/300ms)
User taps artist       → iTunes /lookup?entity=song → "pick 2 songs" grid (cached)
                       → background job (async, user never waits):
                            MusicBrainz search → MBID + genres
                            Last.fm getSimilar(mbid) + getInfo → edges + listeners
User taps 2 songs      → saved with previewUrl + artwork
All jobs done          → profileReady = true → user enters match pool
```

**INVARIANT: the scorer NEVER calls external APIs.** It reads only the local `artists` cache. This keeps scores deterministic, fast, and immune to rate limits.

## Scoring algorithm — 3 layers, Score = 100 × (0.5·L1 + 0.3·L2 + 0.2·L3)

Weights live in a config object (`server/matching/config.js`), tunable without redeploy.

**L1 — Direct artist overlap (rank + rarity weighted):**
```
for each shared artist (match by mbid, fallback normalizedName):
  rankWeight  = ((5 - rankA)/4) × ((5 - rankB)/4)
  rarityBoost = min(2.0, 1 + log10(MAX_LISTENERS / artist.listeners))
  contribution = rankWeight × rarityBoost
L1 = min(1, Σ contributions / NORM)   // NORM calibrated via seed histogram
```
Rationale: two fans of a niche artist are a stronger signal than two fans of a mega-star (standard inverse-popularity weighting from collaborative filtering).

**L2 — Similar-artist bridge (Last.fm graph):**
```
edges(A→B): for each artist a of A, max Last.fm match where a.similar ∩ B.artists
L2 = (mean(edges A→B) + mean(edges B→A)) / 2   // symmetric by construction
```
Match similar-list entries by mbid when present, else normalizedName (empty-mbid issue).

**L3 — Genre Jaccard (the floor):**
```
L3 = |genresA ∩ genresB| / |genresA ∪ genresB|   // both exactly 3 chips, same curated list
```
Guarantees no pair scores zero; comparable across all users by construction.

**Graceful degradation:** unresolved-MBID artists still contribute to L1 via itunesId and get genres from iTunes; they just lack L2 edges. Score stays valid.

## The Blend (signature feature)

On match creation (not on swipe), generate an 8-track blend: interleave 4 tracks from each user's saved 8, guaranteeing both users' rank-1 artists appear. Lives entirely in-app: cover art + 30-sec iTunes previews (expo-av) + deep-links out to Spotify/Apple for full listening. Swipe cards show a lighter teaser: shared/similar artists highlighted + compatibility score.

## Build order (work top to bottom)

1. **Security first:** rotate MongoDB + Cloudinary credentials (exposed in public git history); delete Spotify routes/env vars; add express-rate-limit to auth + waitlist.
2. **Waitlist endpoint:** `POST /api/waitlist` → MongoDB; wire the live harmoni.cc form.
3. **`server/services/music.js`:** iTunes proxy endpoints (artist search, artist top tracks) with Mongo-backed cache (searchCache TTL ~7d, artistTracks TTL ~30d).
4. **Background resolution worker:** MusicBrainz (queued 1/sec) + Last.fm (getSimilar + getInfo) → artists cache; sets profileReady.
5. **Onboarding endpoints:** save genres/artists/tracks with strict validation (exactly 3/4/8).
6. **`server/matching/score.js`:** the 3-layer scorer, TEST-FIRST (fixtures below).
7. **Seed script:** 15 realistic fake profiles + pairwise histogram script for weight calibration.
8. **Swipe/match endpoints + blend generator.**
9. **Socket.io chat** (delivery confirmation, typing indicators).

## Testing requirements for the scorer

Fixtures: twins (≈100) · opposites (≈ L3 floor) · bridge couple (0 shared artists, adjacent scenes → mid-range) · false friends (1 shared mega-star only → modest; validates rarity weighting).
Also: symmetry (score(A,B) === score(B,A)), determinism (no external calls), degradation (unresolved MBIDs → valid score), histogram of 15 seed profiles' 105 pairs targeting ~20–90 spread.

## Project conventions

- All external API calls go through the server; mobile only talks to our API.
- `BASE_URL` in `mobile/src/lib/api.ts` must be env-based (currently hardcoded dev IP — fix when touched).
- Landing page (harmoni.cc) is Next.js App Router, deployed on Railway.
- Waitlist before launch; cold-start handled via seed profiles.
