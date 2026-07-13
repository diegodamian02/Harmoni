# Harmoni

A music-based dating app that matches people by what they actually listen to — not personality quizzes.

> "Most dating apps ask where you went to school. We ask what you listen to at 2am."

---

## What It Is

Harmoni connects users through Spotify listening data. Top artists and tracks feed a compatibility scoring algorithm that surfaces your music twin. Match, chat, vibe.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native · Expo SDK 54 · TypeScript |
| Landing page | Next.js (App Router) · Framer Motion · CSS Modules |
| Backend | Node.js · Express · Socket.io |
| Database | MongoDB Atlas |
| Auth | JWT · Spotify OAuth 2.0 |
| Media | Cloudinary |
| Deployment | Railway (backend + landing page) |
| Domain | Namecheap — `harmoni.cc` |

---

## Project Structure

```
Harmoni/
├── mobile/               # React Native / Expo app
│   ├── app/              # expo-router screens
│   │   ├── _layout.tsx   # Root layout, auth guard, font loading
│   │   ├── index.tsx     # Entry — redirects to /(auth)/landing
│   │   ├── (auth)/       # Landing, login, register screens
│   │   └── (tabs)/       # Main app: swipe, matches, messages, profile
│   └── src/
│       ├── context/      # AuthContext (JWT state)
│       ├── lib/api.ts    # HTTP client, BASE_URL dev/prod switch
│       └── components/   # Shared UI components
│
├── server/               # Express backend
│   ├── app.js            # Entry point, Socket.io setup
│   └── routes/
│       ├── auth.js       # Register, login, Spotify OAuth
│       ├── user.js       # Profile CRUD
│       ├── match.js      # Swipe logic, match creation
│       └── messages.js   # Chat history (REST)
│
└── web/                  # Next.js landing page
    ├── app/
    │   ├── layout.tsx    # Fonts, metadata, Google Analytics
    │   ├── page.tsx      # Server component → ClientWrapper
    │   └── globals.css   # CSS variables, reset
    ├── components/
    │   ├── ClientWrapper.tsx     # ssr:false dynamic import wrapper
    │   ├── MainPage.tsx          # Splash/main crossfade orchestrator
    │   ├── Splash.tsx            # Letter-reveal animation
    │   ├── Nav.tsx               # Sticky frosted-glass nav
    │   ├── HeroSection.tsx       # Parallax hero + album covers
    │   ├── HookSection.tsx       # "We ask what you listen to at 2am"
    │   ├── HowItWorksSection.tsx # 3-step explainer
    │   ├── WaitlistSection.tsx   # Email capture form
    │   └── Footer.tsx
    └── public/albums/            # Album cover art (local, no CDN)
```

---

## Phases

### Phase 0 — Foundation
**Status: Complete**

- [x] Monorepo structure (`mobile/`, `server/`, `web/`)
- [x] Express backend scaffolded with routes for auth, users, matches, messages
- [x] MongoDB Atlas connected
- [x] JWT authentication (register, login)
- [x] Expo project bootstrapped with TypeScript and expo-router
- [x] Root layout with auth guard and font loading
- [x] AuthContext for global JWT state
- [x] API client with dev/prod BASE_URL switching

---

### Phase 1 — Core Mobile App
**Status: Complete (needs end-to-end testing)**

- [x] Auth flow UI — landing, login, register screens
- [x] Spotify OAuth routes in backend
- [x] Spotify redirect URIs registered in Spotify Developer Dashboard
- [x] Socket.io wired up server-side
- [x] Cloudinary image upload configured
- [x] Mobile app runs on iPhone via Expo Go (LAN mode)

---

### Phase 2 — Landing Page
**Status: Complete**

- [x] Next.js app with App Router and TypeScript
- [x] Splash screen — bold "harmoni" letter-reveal animation
- [x] Smooth crossfade from splash to hero (no hard cut)
- [x] Parallax hero with 5 floating album covers
- [x] Alternating dark/white sections
- [x] Nav, HookSection, HowItWorksSection, WaitlistSection, Footer
- [x] Poppins + DM Sans via `next/font/google`
- [x] Fully responsive — desktop, tablet, mobile
- [x] Mobile hero: 3 albums visible at top, text block centered below
- [x] Deployed to Railway, domain pending DNS setup
- [x] Google Analytics wired up

---

### Phase 3 — Music Matching (In Progress)
**Status: Not started**

- [ ] Spotify OAuth tested end-to-end on mobile (connect → top artists/tracks saved to MongoDB)
- [ ] Music compatibility scoring algorithm (replace placeholder)
- [ ] Swipe/match flow tested with 2 real accounts
- [ ] Match result screen

---

### Phase 4 — Real-Time Chat
**Status: Not started**

- [ ] Socket.io client wired in `messages.tsx` (currently REST-only)
- [ ] Message delivery confirmation
- [ ] Typing indicators

---

### Phase 5 — Polish & Launch Prep
**Status: Not started**

- [ ] Waitlist backend endpoint — save emails to MongoDB
- [ ] Waitlist "Connect with Spotify" button → real OAuth flow (not `#waitlist` anchor)
- [ ] Open Graph image for link previews (`og:image`)
- [ ] `prefers-reduced-motion` support for all animations
- [ ] Remove debug `console.log` statements from `mobile/app/_layout.tsx`
- [ ] API rate limiting (`express-rate-limit`) on auth endpoints
- [ ] Fix hardcoded `BASE_URL` dev IP in `mobile/src/lib/api.ts`
- [ ] Rotate all exposed credentials (see Security below)

---

## Environment Variables

### Backend (`server/` — set in Railway)

```
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_CALLBACK_URL=https://api.harmoni.cc/auth/spotify/callback
CLIENT_URL=https://api.harmoni.cc
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NODE_ENV=production
# Do NOT set PORT — Railway injects it
```

### Landing page (`web/` — set in Railway)

```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Local Development

### Backend
```bash
cd server
npm install
npm run dev   # nodemon on port 8333
```

### Landing page
```bash
cd web
npm install
npm run dev   # Next.js on port 3000
```

### Mobile
```bash
cd mobile
npm install
npx expo start --lan   # Connect iPhone on same network via Expo Go
```

Set `BASE_URL` in `mobile/src/lib/api.ts` to your Mac's LAN IP while in dev.

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Backend | Railway | Root: `server/`, start: `node app.js` |
| Landing page | Railway | Root: `web/`, build: `npm run build`, start: `npm start` |
| Database | MongoDB Atlas | Whitelist `0.0.0.0/0` for Railway egress |
| Domain | Namecheap | `api.harmoni.cc` → Railway backend; `harmoni.cc` → Railway web |

---

## Security

The following credentials were exposed during development and **must be rotated before public launch:**

- MongoDB Atlas password
- Spotify Client Secret
- Cloudinary API Secret

Never commit `.env` files. Use Railway's environment variable panel for all secrets.

---

## Built by

Diego — [github.com/diegodamian02](https://github.com/diegodamian02)
