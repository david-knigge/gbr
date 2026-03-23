# The Great Benicia Run — Strait to the Finish

Race day companion app for The Great Benicia Run, a charity event supporting the **STEAM Wheel** educational program. Combines an interactive race map with a QR checkpoint scavenger hunt and donation integration.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · Supabase Postgres · Leaflet · Vercel

---

## Features

### Race Info (Map Tab)

- Fullscreen interactive Leaflet map centered on Benicia
- **4 race course overlays** (10k, 5k, Kids 1 Mile, Kids Mini Run) parsed from Strava GPX files
- Course legend with per-course visibility toggles and start times
- Course name + start time on hover
- **Points of Interest markers** — parking, registration, start/finish, aid stations, restrooms, vendor stands
- POI toggle to show/hide all info points at once
- User GPS location tracking with accuracy circle
- Retro styling matching the race brand (Stonin font, coral/teal/purple/cream palette)

### Quest (Scavenger Hunt Tab)

- First-time intro modal explaining the quest mechanics
- **QR checkpoint scanning** via rear camera (`html5-qrcode`)
- Direct QR URL handler (`/c/[token]`) for native camera app scans
- Multiple-choice STEAM education questions tied to each checkpoint
- Correct/incorrect feedback with explanations
- Checkpoint progress HUD (entries count, X/Y checkpoints, active boosts)
- Duplicate scan prevention

### Raffle & Rewards Engine

- **Ledger-based raffle entry tracking** — every entry change is an auditable ledger row
- Entry sources: checkpoint scans, correct answers, milestones, donation bonuses
- **Milestone bonuses**: 3 checkpoints (+2), 5 checkpoints (+5), all checkpoints (+10)
- **Donation tier rewards**:
  - $5+ → 5 entries
  - $20+ → 15 entries + 2x multiplier on next 3 scans
  - $50+ → 50 entries + donor badge
- Multiplier system with remaining-uses countdown

### Donations

- Slide-up donate overlay (stays on current page, no navigation)
- Donor perks breakdown
- Unique `WHEEL-XXXX` app code per user for linking donations
- Copy-to-clipboard for app code
- Collapsible raffle eligibility form (email + nickname)
- Givebutter integration (webhook handler ready, campaign link)

### Guest Identity

- No login required — automatic guest account creation
- `WHEEL-XXXX` app code stored in localStorage
- Concurrent init deduplication (prevents race conditions)
- Single `get_user_state()` Postgres RPC returns all user data in one call

### Admin Dashboard (`/admin`)

- Password-protected (env var `ADMIN_PASSWORD`)
- **Dashboard** — total users, scans, donations, raffle entries, unmatched donations
- **Checkpoints** — CRUD with auto-generated QR tokens, linked questions, sort order
- **Questions** — CRUD with 3-4 answer options, correct answer, explanation
- **Map POIs** — CRUD for all map markers (parking, stands, aid stations, etc.) with lat/lng, type, active toggle
- **Donations** — list with manual reconciliation for unmatched donations (link to user by app code)
- **Raffle** — entry table sorted by total, CSV export

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/guest/init` | Create or return guest user |
| GET | `/api/me` | Full user state (single RPC call) |
| POST | `/api/scan` | Process QR scan, award entries |
| POST | `/api/question/answer` | Submit answer, award bonus |
| POST | `/api/profile` | Update nickname/email |
| GET | `/api/checkpoints` | List active checkpoints |
| GET | `/api/pois` | List active POIs |
| POST | `/api/webhooks/givebutter` | Donation webhook handler |
| * | `/api/admin/*` | Admin CRUD routes (auth, checkpoints, questions, pois, donations, raffle) |

---

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in Supabase + admin password
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (JWT format) |
| `ADMIN_PASSWORD` | Admin panel password |
| `GIVEBUTTER_WEBHOOK_SECRET` | Givebutter webhook HMAC secret (optional until campaign is live) |
| `GIVEBUTTER_API_KEY` | Givebutter API key (optional) |
| `GIVEBUTTER_CAMPAIGN_ID` | Givebutter campaign ID (optional) |

### Database

Run migrations against Supabase (SQL editor or CLI):

```
supabase/migrations/001_initial_schema.sql    — core tables + seed data
supabase/migrations/002_get_user_state_function.sql — user state RPC
supabase/migrations/003_pois_table.sql         — POI table + seed data
```

### Deploy

Connect the repo to Vercel, set environment variables, and deploy. Course data and POI seeds are baked into the migrations.

---

## Project Structure

```
src/
├── app/
│   ├── (participant)/     # Race Info + Quest pages
│   ├── admin/             # Admin dashboard + CRUD pages
│   ├── api/               # API routes
│   ├── c/[token]/         # Direct QR scan handler
│   └── globals.css        # Tailwind theme + Stonin font
├── components/
│   ├── race-map.tsx       # Leaflet map with courses, POIs, checkpoints
│   ├── donate-overlay.tsx # Slide-up donation panel
│   ├── qr-scanner.tsx     # Camera QR scanner
│   ├── bottom-nav.tsx     # Tab navigation
│   └── ui/                # Button, Card, CopyButton
├── contexts/
│   └── user-context.tsx   # Global user state provider
└── lib/
    ├── course-data.ts     # GPX-derived course coordinates
    ├── map-data.ts        # POI types + fallback data
    ├── rewards.ts         # Reward engine (entries, milestones, multipliers)
    ├── identity.ts        # Guest identity + localStorage
    ├── api-client.ts      # Fetch wrapper with user ID header
    └── supabase/          # Server + client Supabase instances
```
