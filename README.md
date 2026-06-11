# Grounded

**Find calm. Simplify decisions. Stay grounded.**

Grounded is a faith-centred decision companion. You dump everything on your mind,
and it helps you separate **facts from assumptions**, **weigh your options**, and
sit with a few questions worth praying over — grounded in scripture along the way.
It's an installable, offline-capable PWA.

## How it works

The home screen is a three-step journey:

1. **Dump** — write out everything on your mind and pick how big the decision feels.
2. **Sort** — AI splits what you wrote into objective facts vs. assumptions, with a
   relevant verse.
3. **Decide** — it lays out the options, suggests one with its trade-offs, and offers
   a few questions to pray over before you commit.

Every reflection is saved to your **history** automatically (locally, and synced to
your account when signed in). A **Break glass** button is always within reach for
moments of crisis, opening immediate support resources.

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** for styling, **next-themes** for light/dark
- **[Groq](https://groq.com)** for the AI reasoning (`/api/groq`)
- **[API.Bible](https://scripture.api.bible)** for scripture lookups (`/api/verse`)
- **[Supabase](https://supabase.com)** for auth and cross-device sync
- **framer-motion** + **lucide-react** for motion and icons
- A service worker (`public/sw.js`) for offline support and installability

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the template and fill in your keys:

```bash
cp .env.example .env.development.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project (auth + sync). Safe to expose; protected by row-level security. |
| `GROQ_API_KEY` / `GROQ_MODEL` | Server-side Groq access. Users may also supply their own key in Settings. |
| `BIBLE_API_BASE` / `BIBLE_API_KEY` / `BIBLE_ID` | Scripture provider (API.Bible). |
| `NEXT_PUBLIC_BIBLE_*` | Public translation metadata shown in the UI (name, copyright, publisher). |

The app degrades gracefully: without Supabase, history stays local; without a server
Groq key, users provide their own.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint. |
| `npm run gen:icons` | Regenerate app icons + favicon from `public/icons/icon-512.png`. |
| `npm run gen:splash` | Regenerate the iOS launch-image set into `public/splash/`. |

## PWA assets

Icons and iOS splash screens are generated from a single 512×512 master
(`public/icons/icon-512.png`):

- `scripts/gen-icons.mjs` produces the maskable/Apple/favicon icons.
- `scripts/gen-splash.mjs` produces the `apple-touch-startup-image` set (light + dark)
  from the device matrix in `lib/splash-devices.json`. The matching `<link>` media
  queries are emitted by `lib/splashScreens.ts` and wired into the layout metadata.

Re-run the relevant `gen:*` script after changing the master image or device matrix.

## Project structure

```
app/         App Router routes, layout, API routes, manifest
components/  UI (the Journey flow, Navbar, Settings, modals, sync)
lib/         Domain logic: bible, history, settings, Supabase clients, types
public/      Icons, splash images, service worker
scripts/     Asset generators
```

> **Note for contributors:** see `AGENTS.md` — this project pins a specific Next.js
> version whose conventions may differ from older releases. Check the bundled docs
> under `node_modules/next/dist/docs/` before reaching for remembered APIs.
