# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server with Turbopack
npm run build    # Production build
npm run lint     # ESLint check
npm run start    # Start production server
```

## Architecture Overview

This is a **branded AI music generation experience** ("GOAT Music") built with Next.js 15 (App Router). Users enter their phone number, select a music genre, and the app generates a custom AI song, displays an audio player with waveform, and generates a QR code linking to a post-experience survey.

### User Flow (State Machine in `app/page.tsx`)

```
start → phone → genre → loading → player → survey
```

`app/page.tsx` is the central orchestrator: it holds all state, manages polling for song generation (every 2s), and renders the current screen.

### API Routes (`app/api/`)

| Route | Purpose |
|---|---|
| `POST /api/generate-song` | Calls Box AI Music API `/lyrics` then `/generate`; returns `taskId` |
| `GET /api/get-task?taskId=` | Polls Box `/generate/record-info` for status/audio URL |
| `POST /api/save-media` | Proxies metadata to Firebase Cloud Function ingest endpoint |
| `GET /api/download?src=&filename=` | Secure proxy for audio downloads with host whitelist |

The Box AI Music API base URL comes from `MUSIC_API_BASE` env var. Song generation is async — the frontend polls `/api/get-task` until status reaches `SUCCESS`.

### Screens (`app/screens/`)

Each screen is a self-contained component receiving `onNext`/`onBack` callbacks from the parent state machine. `PlayerScreen` generates a QR code (via `qrcode.react`) that encodes the survey URL with pre-filled params (`src`, `filename`, `taskId`, `phone`).

### Firebase (`firebaseConfig.ts`, `app/services/SurveyService.ts`)

Firebase is configured with `NEXT_PUBLIC_FIREBASE_*` environment variables (browser-safe). Firestore stores survey responses in the `"surveys"` collection. `SurveyService.ts` provides typed helpers with real-time `onSnapshot` listeners.

### Survey (`app/survey/`)

Separate route at `/survey` where users fill out a post-experience form. Data is saved to Firestore. `/participants` shows a data view of collected survey responses.

### Layout & Assets

- `app/layout.tsx`: Full-screen background video (mobile vs. desktop variants), Windows + Intel logos overlaid
- `public/assets/GOATMUSIC/`: Brand videos and graphics organized by screen
- Tailwind CSS v4 is used for styling; responsive design uses `lg:` breakpoints to switch between mobile and desktop layouts

## Key Environment Variables

```
MUSIC_API_BASE          # Box AI Music API base URL
MUSIC_API_KEY           # Box AI Music API key
MUSIC_DEFAULT_MODEL     # AI model version (e.g., V4)
INGEST_TOKEN            # Token for central media ingestion service

NEXT_PUBLIC_FIREBASE_*  # Firebase project config (browser-exposed)
```

## Security Notes

- `/api/download` whitelists allowed source hosts — do not remove or loosen this check
- `/api/save-media` whitelists allowed project names (`goatHeart`, `goatMusic`, `goatBody`)
- All API inputs are validated with Zod schemas

## Deployment

Deployed to **Netlify** via `netlify.toml`. Build command: `npm run build`. Requires Node 20. Uses `@netlify/plugin-nextjs` for SSR support.
