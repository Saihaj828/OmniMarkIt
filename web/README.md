# OmniMarkIt — Web (Next.js 14)

The student / tutor / admin portal. Next.js 14 App Router + TypeScript +
Tailwind, talking to the FastAPI backend over REST with a JWT.

## Quick start

```bash
cd web
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                         # http://localhost:3000
```

> Start the backend first (see ../backend/README.md) so the API is reachable.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing / hero |
| `/login`, `/register` | Auth (role chosen at signup) |
| `/tutors` | Tutor search (filter by subject, rate, text) |
| `/tutors/[id]` | Public profile + reviews + **booking** |
| `/dashboard` | Student or tutor dashboard (role-aware) |
| `/sessions/[id]` | Session detail: **pay**, session-room placeholder, **review** |
| `/messages` | Student ↔ tutor messaging |
| `/billing` | Plans, subscribe, payment history (student) |
| `/disputes` | File + track disputes (student/tutor) |
| `/notifications` | Full notification feed + mark read |
| `/settings` | Account, profile, change password |
| `/trust-safety` | Trust & Safety info page |
| `/forgot-password`, `/reset-password` | Password reset (dev token shown in-app) |
| `/onboarding` | Guided 9-step tutor vetting wizard |
| `/availability` | Tutor weekly hours + time-off exceptions |
| `/reviews` | Tutor's reviews + public replies |
| `/admin` | Vetting queue (+ credential viewer), users, disputes, flagged sessions |

The session page also handles **pay (+promo, +simulated decline)**, **session room
with a consent gate**, **materials**, **report modal**, **reschedule**, and **cancel**.

## How it's wired

- **`lib/api.ts`** — typed fetch client. Reads `NEXT_PUBLIC_API_URL`, attaches
  the JWT from `localStorage`, throws `ApiError` with the backend's `detail`.
- **`lib/auth.tsx`** — `AuthProvider` + `useAuth()`. Hydrates the current user
  from `/api/auth/me` on load; exposes `login` / `register` / `logout`.
- **`components/ui.tsx`** — small design-system primitives (Button, Card, Input,
  Badge, Stars…) in the OmniMarkIt navy/gold/cream palette.
- Pages are client components that fetch on mount with `useEffect` and the api
  client. (The backend `CLAUDE.md` calls for TanStack Query + Zustand; this demo
  keeps the dependency surface minimal with plain hooks so it installs and runs
  cleanly. Swapping in TanStack Query later is a drop-in around `lib/api.ts`.)

## Notes

- Money is stored in **cents** on the backend; `lib/format.ts#formatCents`
  converts for display. Ratings are stored **×100** (`formatRating`).
- Auth is via JWT in `localStorage`. For production, move to httpOnly cookies +
  the `middleware.ts` route-guard pattern described in the project spec.
