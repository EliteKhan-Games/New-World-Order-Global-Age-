# New World Order — Grand Strategy (Prototype)

A browser-based foundation for the multiplayer grand-strategy game design. This first build includes:

- Supabase email/password authentication
- Campaign creation and open campaign browser
- 20 selectable nations based on the current design roster
- A rotatable, zoomable 3D Earth globe with political/terrain/military display modes
- Country ownership saved in Supabase
- Realtime refresh when nation ownership changes
- A starter national overview with treasury, population and technology baseline
- GitHub-ready Vite + React project structure

## Important scope note

This is the **first playable foundation**, not the complete 1700–2030 simulation. The initial map highlights the 20 playable national shapes. Province-level borders, randomized mineral deposits, cities, research, factories, equipment design, AI countries, combat and diplomacy are planned next. The game currently starts in 1700 and uses modern geographic identities as specified.

## 1. Create Supabase project

1. Create a project at [Supabase](https://supabase.com/).
2. In **Project Settings → API**, copy the Project URL and publishable key (or legacy anon key).
3. In the project **SQL Editor**, open `supabase/schema.sql`, paste the entire file and run it.
4. In **Authentication → Providers**, make sure Email is enabled.
5. For quick testing, you can turn off email confirmation in **Authentication → Providers → Email**. For a public game, keep confirmation enabled.

## 2. Run locally

Install Node.js 20.19+ or 22.12+.

```bash
npm install
```

Copy `.env.example` to `.env` and fill it in:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Then start the app:

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

**Never put your Supabase service-role key in `.env` or browser code.** Only use the publishable/anon key in this app.

## 3. Put it on GitHub

1. Create a new empty repository on [GitHub](https://github.com/new), for example `new-world-order`.
2. Unzip this project, open a terminal in its folder, then run:

```bash
git init
git add .
git commit -m "Initial grand strategy prototype"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/new-world-order.git
git push -u origin main
```

Do not commit `.env`. It is ignored by `.gitignore`.

## 4. Deploy the web app

A simple option is [Vercel](https://vercel.com/):

1. Import the GitHub repository.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under Project Environment Variables.
3. Deploy. Vercel detects Vite automatically.

You can also deploy to Netlify using the same environment variables and build command `npm run build` with output folder `dist`.

## 5. Current database model

- `games`: campaign name, host, status and simulation year
- `game_players`: user-to-campaign and selected nation
- `nations`: one row per playable nation per campaign
- `game_events`: campaign history/event feed starter

Creation and country selection use database RPC functions with server-side checks. Row Level Security is enabled. The browser is not allowed to directly edit treasury or nation ownership.

## Development roadmap

1. Province data + ownership and dynamic borders
2. AI nations and offline simulation tick system
3. Cities, infrastructure and logistics
4. Geological deposits, surveys, discoveries and permanent mines
5. Resource economy and manufacturing chains
6. Research tree and historical technology gates
7. NPC defense manufacturers and government contracts
8. Vehicle, aircraft, ship and missile designers
9. Military units, movement and combat
10. Diplomacy, trade, multiplayer chat and news archive

Build these systems incrementally while preserving the approved design decisions in the handoff document.
