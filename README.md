# Harmoni

A music-based dating app that matches people by what they actually listen to — not personality quizzes.

> "Most dating apps ask where you went to school. We ask what you listen to at 2am."

---

## Team

| Person | Role |
|---|---|
| **Diego** | Full-stack engineering |
| **Virginia** | UI/UX & motion design (Figma) |

**For Virginia:** Figma frames labeled **"Ready to build"** get implemented exactly as specced. The visual language is Poppins (titles) + DM Sans (body), dark `#212121` and white sections, pink-to-deep gradient accent (`#ff69b4 → #73105a`). The landing page at `harmoni.cc` is the brand reference — the app inherits from it.

---

## What It Is (Post-Pivot — July 2026)

Spotify OAuth is **out** (Feb 2026 API restrictions made it unviable). Harmoni is now fully self-contained:

- Users build a taste profile manually: **3 genres + 4 artists + 8 songs**
- Music data comes from three open APIs proxied through our server (iTunes, MusicBrainz, Last.fm)
- A 3-layer compatibility algorithm scores every pair — no Spotify required
- Each match generates a shared **8-track Blend** playlist using 30-sec iTunes previews

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native · Expo SDK 54 · TypeScript · expo-router |
| Landing page | Next.js (App Router) · Framer Motion · CSS Modules |
| Backend | Node.js · Express · Socket.io |
| Database | MongoDB Atlas |
| Auth | JWT (email/password) |
| Media | Cloudinary |
| Deployment | Railway (`api.harmoni.cc` + `harmoni.cc`) |
| Domain | Namecheap — `harmoni.cc` |

---

## Data Stack

All external API calls go through **our server only** — the mobile client never calls these directly.

| API | Purpose | Limits |
|---|---|---|
| **iTunes Search** | Artist autocomplete, top tracks, cover art, 30-sec previews | ~20 req/min — server cache mandatory |
| **MusicBrainz** | Canonical artist IDs (MBIDs) + genre tags | 1 req/sec — queued worker required |
| **Last.fm** | Similar-artist graph + listener counts for rarity scoring | Free key · mbid fields often empty — normalizedName fallback |

---

## Project Structure

```
Harmoni/
├── mobile/                   # React Native / Expo app
│   ├── app/
│   │   ├── _layout.tsx       # Root layout, auth guard
│   │   ├── index.tsx         # Entry → redirects to /(auth)/landing
│   │   ├── (auth)/           # Landing, login, register
│   │   └── (tabs)/           # Swipe, matches, messages, profile
│   └── src/
│       ├── context/          # AuthContext (JWT)
│       ├── lib/api.ts        # HTTP client
│       └── components/       # Shared UI
│
├── server/                   # Express backend
│   ├── app.js                # Entry point + Socket.io
│   ├── models/
│   │   ├── User.js           # User + musicProfile schema
│   │   ├── Artist.js         # Shared artist cache (iTunes/MusicBrainz/Last.fm)
│   │   └── Message.js        # Chat messages
│   ├── routes/
│   │   ├── auth.js           # Register, login (rate limited)
│   │   ├── user.js           # Profile CRUD
│   │   ├── music.js          # iTunes proxy + onboarding endpoints [TO BUILD]
│   │   ├── match.js          # Swipe, match creation, blend
│   │   └── messages.js       # Chat history
│   ├── services/
│   │   └── music.js          # iTunes/MusicBrainz/Last.fm service layer [TO BUILD]
│   └── matching/
│       ├── score.js          # 3-layer compatibility scorer [TO BUILD]
│       └── config.js         # Tunable scoring weights [TO BUILD]
│
└── web/                      # Next.js landing page
    ├── app/layout.tsx         # Fonts, GTM, metadata
    ├── components/            # Splash, Hero, Nav, Sections, Footer
    └── public/albums/         # Local album art
```

---

## Matching Algorithm

**Score = 100 × (0.5·L1 + 0.3·L2 + 0.2·L3)**

| Layer | What it measures | Weight |
|---|---|---|
| **L1** Direct overlap | Shared artists, weighted by rank (1–4) × rarity (niche fans score higher) | 50% |
| **L2** Similar-artist bridge | Last.fm similarity graph edges between each user's artists | 30% |
| **L3** Genre Jaccard | Overlap of the 3 chosen genre chips | 20% |

Scorer reads only the local MongoDB artists cache — never calls external APIs at match time.

---

## The Blend (Signature Feature)

On match creation: 8-track playlist interleaving 4 tracks from each user, guaranteeing both rank-1 artists appear. Lives in-app with 30-sec iTunes previews + deep-links to Spotify/Apple Music for full listening.

---

## Build Phases

### Phase 0 — Foundation
**Status: Complete**
- [x] Monorepo structure
- [x] Express + MongoDB + JWT auth
- [x] Expo app with expo-router + AuthContext
- [x] Socket.io server-side

### Phase 1 — Security & Cleanup
**Status: Complete**
- [x] Spotify OAuth removed entirely
- [x] passport / passport-spotify / express-session removed
- [x] User model rebuilt with `musicProfile` schema
- [x] Rate limiting on auth endpoints (10 req / 15 min)
- [ ] Rotate MongoDB + Cloudinary credentials ← **Diego: do this manually**

### Phase 2 — Waitlist
**Status: Not started**
- [ ] `POST /api/waitlist` → save email to MongoDB
- [ ] Wire `harmoni.cc` waitlist form to live endpoint
- [ ] Rate limit the waitlist endpoint

### Phase 3 — Music Service Layer
**Status: Not started**
- [ ] `server/services/music.js` — iTunes search proxy with Mongo cache (TTL 7d)
- [ ] iTunes artist top-tracks endpoint (TTL 30d)
- [ ] MusicBrainz background worker (p-queue, 1 req/sec, permanent cache)
- [ ] Last.fm `getSimilar` + `getInfo` → artists collection
- [ ] `profileReady` flag set when all background jobs complete

### Phase 4 — Onboarding Endpoints
**Status: Not started**
- [ ] `POST /api/onboarding/genres` — save 3 genre chips (validated against curated list)
- [ ] `GET /api/music/search?q=` — iTunes artist autocomplete
- [ ] `GET /api/music/artists/:id/tracks` — top tracks for song picker
- [ ] `POST /api/onboarding/artists` — save 4 ranked artists + trigger background jobs
- [ ] `POST /api/onboarding/tracks` — save 8 songs (2 per artist)

### Phase 5 — Scoring & Matching
**Status: Not started**
- [ ] `server/matching/score.js` — 3-layer scorer (test-first)
- [ ] Seed script: 15 realistic fake profiles
- [ ] Pairwise histogram for weight calibration
- [ ] Swipe endpoints + match creation
- [ ] Blend generator (8-track interleave)

### Phase 6 — Mobile UI
**Status: Blocked on Figma / In parallel with backend**
- [ ] Remove Spotify references from mobile
- [ ] Genre chip screen (3 selections from curated list)
- [ ] Artist search screen (debounced, autocomplete from iTunes proxy)
- [ ] Song picker screen (2 songs per artist, cover art + 30-sec preview)
- [ ] Swipe cards (compatibility score + shared artists highlighted)
- [ ] Match screen + Blend player (expo-av)
- [ ] Socket.io client in messages screen

### Phase 7 — Landing Page Update
**Status: Not started**
- [ ] Remove "Connect with Spotify" button from hero
- [ ] Update HowItWorksSection copy (tap-based onboarding, no Spotify)
- [ ] "Connect with Spotify" → "Join the Waitlist" single CTA
- [ ] OG image for link previews

### Phase 8 — Launch Prep
**Status: Not started**
- [ ] `prefers-reduced-motion` support for animations
- [ ] Remove debug `console.log` from `mobile/app/_layout.tsx`
- [ ] API rate limiting on all public endpoints
- [ ] Fix hardcoded `BASE_URL` in `mobile/src/lib/api.ts`
- [ ] Cold-start seed profiles in production DB

---

## Local Development

### Backend
```bash
cd server
npm install
node app.js   # runs on :8333
```

### Landing page
```bash
cd web
npm install
npm run dev   # runs on :3000
```

### Mobile
```bash
cd mobile
npm install
npx expo start --lan
# Connect iPhone on same network via Expo Go
# Set BASE_URL in mobile/src/lib/api.ts to your Mac's LAN IP
```

---

## Environment Variables

### Backend (`server/.env` + Railway backend service)
```
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
LASTFM_API_KEY=
LASTFM_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NODE_ENV=production
# Do NOT set PORT — Railway injects it
```

### Landing page (Railway web service)
```
NEXT_PUBLIC_GTM_ID=GTM-TWRLQBQC
```

---

## Deployment

| Service | Platform | Config |
|---|---|---|
| Backend | Railway | Root: `server/`, start: `node app.js` |
| Landing page | Railway | Root: `web/`, build: `npm run build`, start: `npm start` |
| Database | MongoDB Atlas | Whitelist `0.0.0.0/0` for Railway egress |

**DNS (Namecheap):**
- `api.harmoni.cc` → Railway backend
- `harmoni.cc` / `www` → Railway web

---

## Security Notes

- Never commit `.env` files — `.gitignore` covers this
- Credentials go in Railway environment variables only
- **MongoDB password + Cloudinary API secret need manual rotation** (exposed in earlier git history)
- Rate limiting: auth endpoints 10 req/15min · waitlist TBD
