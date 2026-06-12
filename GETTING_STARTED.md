# OmniMarkIt — Getting Started

This is the complete, runnable OmniMarkIt tutoring marketplace: a **FastAPI
backend** (28-table data model, JWT auth, Alembic, Celery, AES-256) and a
**Next.js 14 frontend**, wired together and verified end-to-end.

```
backend/   FastAPI app   → see backend/README.md
web/       Next.js app   → see web/README.md
start.sh   one-command launcher (backend + frontend)
```

## Run it — one command

```bash
./start.sh
```

First run installs everything and seeds the DB. Then open
**http://localhost:3000** (API docs at **http://localhost:8000/docs**).

## …or two terminals (more control)

**Terminal 1 — backend → :8000**
```bash
cd backend

python -m venv .venv

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

python -m app.seed

uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend → :3000**
```bash
cd web
npm install
cp .env.local.example .env.local
npm run dev
```

## Demo accounts (password `password123`)

| Email | Role | See |
|-------|------|-----|
| `student@omnimarkit.com` | student | dashboard, booking, **billing**, payment (+promo), reviews, messaging, **disputes** |
| `tutor@omnimarkit.com` | tutor (approved) | tutor dashboard, profile editor, **earnings + payout**, sessions |
| `pending@omnimarkit.com` | tutor (in review) | the **vetting pipeline** form (credentials, ID, teaching approach) |
| `admin@omnimarkit.com` | admin | **vetting queue, users, disputes, flagged sessions** |

## Full demo flow

1. **Student** → Find Tutors → book a session → pay (try promo `WELCOME10`).
2. **Tutor** → dashboard → Start, then Mark completed.
3. **Student** → session page → leave a review (updates the tutor's cached rating).
4. **Tutor** → dashboard → Request payout of available earnings.
5. **Student** → Billing → choose a plan; Disputes → file one.
6. **Admin** → console → approve a pending tutor, resolve a dispute, set a legal
   hold on a flagged session (which then blocks cancellation).

## Screens now built (~20 working pages)

Core: landing, login/register, **password reset**, tutor search, tutor profile +
booking, student & tutor dashboards, session page (pay/room/review/materials/
reschedule/cancel/report), messaging, **billing**, **disputes**, **notifications
center**, **settings**, **trust & safety**, tutor **availability manager**, tutor
**reviews**, the guided 9-step **tutor onboarding wizard**, and the admin console
(vetting queue + **credential viewer**, users, disputes, flagged sessions).

Still design-only (need external accounts or a mobile runtime): the 6 mobile
screens, real Stripe/Daily/S3-backed screens (recording playback), and a couple
of niche flows. See the project notes for what each needs.

## Live session room, whiteboard & recordings

- **Video** — each session has a live **Jitsi** call (free, no account) with screen
  share. Click *Join the call* in the session room.
- **Whiteboard** — a shared canvas (draw / colors / eraser / clear) **synced through
  the backend**, so the tutor and student see the same board.
- **Recordings** — click *Record session* to screen-capture the call; the video is
  **stored locally** on the server. An **admin grants view permission** to the
  student and/or tutor (Admin → Recordings). Recordings are **free to view for 7
  days**, then **payable** (configurable via `RECORDING_FREE_DAYS` /
  `RECORDING_PRICE_CENTS`). Granted users browse them at **/recordings**.

See **[DEPLOY.md](DEPLOY.md)** to put the whole thing online for free and to view
the databases.

## Recent additions

- **Admins cannot book lectures** (enforced in API + UI); admins are limited to
  approvals, monitoring, and admin features.
- **Toast notifications** — every profile save shows a clear success toast, even
  on repeated consecutive saves.
- **Notification bell badge** — red count of unread notifications + upcoming
  lectures, polled live.
- **No past-date bookings** — blocked in the UI (date picker `min`) and the API.
- **Payments & payouts via Stripe** — real Stripe SDK integration that activates
  when you set `STRIPE_SECRET_KEY`; simulates otherwise. Tutors provide a Stripe
  account at registration; students see detailed plan info before paying.
- **"Other" subject** — tutors can add a custom subject (e.g. Aviation).
- **PDF uploads** — credentials, KYC ID, and session materials accept **PDF only**
  (validated by extension, content-type, and magic bytes).
- **Weekly availability in the application** — configure multiple slots during
  onboarding.
- **KYC** — functional PDF document upload.
- **Background checks via Checkr** — real Checkr API integration that activates
  when you set `CHECKR_API_KEY`; simulates otherwise.

## Verified

- Backend: **pytest 5/5**, live API **27/27** core flows + **14/14** prior-batch
  checks + **13/13** new-feature checks; Alembic migration applies all 28 tables.
- Frontend: `tsc --noEmit` clean, `next build` green (**20 routes**).

## Troubleshooting

**Registration or login fails / HTTP 500 after upgrading the bundle.**
You have a stale `backend/omnimarkit.db` from an older version (SQLite doesn't
auto-add new columns). The app now **auto-heals** missing columns on startup, but
if you're ever stuck, the clean reset is:

```bash
cd backend
rm -f omnimarkit.db
python -m app.seed
```

**Frontend can't reach the API.** Make sure the backend is running on port 8000
(`http://localhost:8000/docs` should load) and that `web/.env.local` has
`NEXT_PUBLIC_API_URL=http://localhost:8000`.

## Deploy it for free + view the databases

Full step-by-step in **[DEPLOY.md](DEPLOY.md)**: frontend on **Vercel**, backend +
**Postgres** on **Render** (both free), via the included `Dockerfile`, `render.yaml`,
and `vercel.json`. That guide also covers **four ways to view the database** (the
Admin → Database tab, Swagger `/docs`, DB Browser for SQLite, and the `sqlite3` /
`psql` CLIs).

## Going live with Stripe & Checkr (your keys)

These integrations are **real code** that simulate in dev and activate the moment
you provide keys in `backend/.env`:

- **Stripe** — set `STRIPE_SECRET_KEY=sk_test_...` (and `STRIPE_PUBLISHABLE_KEY`).
  Charges, payouts (Connect transfers), and subscriptions then run for real.
- **Checkr** — set `CHECKR_API_KEY=...`. Background checks then create real Checkr
  candidates + reports.

No keys? Everything still works end-to-end in simulation, clearly labeled.

## What's still stubbed / not built

Email/push delivery, Daily.co video + tldraw whiteboard (the session room is a
placeholder), S3-backed file storage (uploads are stored locally under
`backend/uploads/` and served at `/uploads`), and the 6 mobile screens.
