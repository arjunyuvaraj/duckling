# Duckling

A React + TypeScript app for coding practice, classrooms, and live competitions.

## Brand Assets

- `src/assets/Frame 14.svg` is discontinued and should not be used.
- `src/assets/duckling_logo.svg` is the full Duckling mark for large brand placements.
- `src/assets/duckling_icon.svg` is the compact Duckling mark for icon-only placements.
- `public/favicon.svg` is the browser favicon.
- `public/icons.svg` is the shared symbol sprite for small interface icons.

## Local Development

- `npm install`
- `npm run server` starts the backend at `http://localhost:8787`
- `npm run dev:client` starts the frontend with the local `/api` proxy
- `npm run dev` starts both the backend and frontend
- `npm run build` creates the production frontend in `dist`
- `npm run preview` previews the built frontend locally
- `npm run lint` checks the codebase

For the presentation demo, keep `VITE_ENABLE_AUTH_API=false` so the local session flow is used. If the FastAPI auth service is needed, run it with `cd backend && uvicorn app.main:app --reload --port 8000`, then set `VITE_ENABLE_AUTH_API=true` and `VITE_API_BASE_URL=http://localhost:8000`.

## Hosting

Host this as two services: the Node API backend and the static Vite frontend. The local Vite proxy in `vite.config.ts` only applies during development, so production needs real API URLs in the frontend environment variables.

Current hosted backend: `https://duckling-api-332057590473.us-central1.run.app`

### Backend API

Use a Node web service on Render, Railway, Fly.io, or a similar host.

- Root directory: repo root
- Build command: `npm install`
- Start command: `npm run server`
- Port: the server reads `PORT` from the host, with `8787` as the local fallback
- Environment variables:
  - `JUDGE0_BASE_URL=https://ce.judge0.com`
  - `JUDGE0_AUTH_HEADER`, `JUDGE0_AUTH_TOKEN`, `JUDGE0_RAPIDAPI_KEY`, and `JUDGE0_RAPIDAPI_HOST` only if the selected Judge0 provider requires them

Classroom data is currently written by the Node backend to `server/data/classroom-store.json`. For a live class or a longer demo, use a host with persistent disk or move that store to Supabase/Postgres before relying on it for durable data.

### Frontend

Use a static frontend host such as Vercel, Netlify, Render Static Sites, Firebase Hosting, or Cloudflare Pages.

- Build command: `npm run build`
- Publish/output directory: `dist`
- `public/_redirects` is included so Netlify serves `index.html` for routes such as `/classroom`, `/compete`, and `/problem/1`
- Production environment variables:
  - `VITE_CODE_API_BASE_URL=https://duckling-api-332057590473.us-central1.run.app`
  - `VITE_COMPETE_API_BASE_URL=https://duckling-api-332057590473.us-central1.run.app/api`
  - `VITE_ENABLE_AUTH_API=false`

To create a Netlify drag-and-drop build with the hosted backend already wired in:

`VITE_CODE_API_BASE_URL=https://duckling-api-332057590473.us-central1.run.app VITE_COMPETE_API_BASE_URL=https://duckling-api-332057590473.us-central1.run.app/api VITE_ENABLE_AUTH_API=false npm run build`

If the FastAPI auth service is hosted separately, set `VITE_ENABLE_AUTH_API=true` and `VITE_API_BASE_URL=https://your-auth-api-host.example.com`.
