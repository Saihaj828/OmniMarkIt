# Deploying OmniMarkIt for free + viewing the databases

This guide gets the whole app online at **$0** using free tiers, and shows you
how to inspect the database.

```
Frontend (Next.js)  →  Vercel        (free)
Backend  (FastAPI)  →  Render        (free web service)
Database (Postgres) →  Render Postgres (free) — or Neon/Supabase
Video               →  Jitsi meet.jit.si (free, no account)
Recordings          →  stored on the server's disk (see note)
```

---

## A. Deploy the backend (Render, free)

The repo already includes `backend/Dockerfile` and a `render.yaml` blueprint.

1. Push this project to a **GitHub repo**.
2. Go to <https://render.com> → **New → Blueprint** → pick your repo.
   Render reads `render.yaml` and creates **the API service + a free Postgres**.
3. It auto-sets `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_SECRET`. After the first
   deploy, set **`FRONTEND_ORIGIN`** to your Vercel URL (step B), and optionally
   paste `STRIPE_SECRET_KEY` / `CHECKR_API_KEY` to activate those integrations.
4. On boot the container runs `alembic upgrade head`, seeds demo data **only if the
   DB is empty**, then serves. Your API is at `https://omnimarkit-api.onrender.com`
   (docs at `/docs`).

> Prefer not to use Docker? Render can also run a **Python** service:
> Build `pip install -r requirements.txt`,
> Start `alembic upgrade head && python -c "from app.seed import ensure_seed; ensure_seed()" && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

**Alternatives (all free):** Railway, Fly.io, or Hugging Face Spaces (Docker).

---

## B. Deploy the frontend (Vercel, free)

1. Go to <https://vercel.com> → **Add New → Project** → import the repo.
2. Set **Root Directory = `web`** (Vercel detects Next.js automatically).
3. Add an env var **`NEXT_PUBLIC_API_URL`** = your Render API URL
   (e.g. `https://omnimarkit-api.onrender.com`).
4. Deploy. Your site is at `https://your-app.vercel.app`.
5. Go back to Render and set `FRONTEND_ORIGIN` to that Vercel URL (for CORS), then
   redeploy the API.

That's it — the app is fully live.

---

## C. Database choice

- **Local dev:** SQLite (zero setup) — `backend/omnimarkit.db`.
- **Production:** set `DATABASE_URL=postgresql+psycopg://...`. The `render.yaml`
  wires a free Render Postgres automatically. `psycopg` is already in
  `requirements.txt`, and the same models/migrations run on Postgres unchanged
  (UUIDs become native, timestamps are TIMESTAMPTZ).

**Free Postgres alternatives:** Neon (<https://neon.tech>), Supabase
(<https://supabase.com>). Just paste their connection string into `DATABASE_URL`.

---

## D. Recordings storage (important)

Recordings are stored on the server's local disk (`backend/uploads/recordings/`)
and served through a permission-checked endpoint. On free hosts the disk is
**ephemeral** — recordings are lost on redeploy/restart. That's fine for "stored
locally as of now." To persist them:
- Render: attach a **Persistent Disk** (paid), or
- Switch storage to **S3/Backblaze B2** (swap the body of
  `app/services/upload_service.py` / `recording_service.save_recording`).

---

## E. How to view the databases "in action"

You have four easy options:

**1. Admin → Database tab (built in).** Log in as `admin@omnimarkit.com` → Admin
console → **Database** tab shows live row counts per table. (API:
`GET /api/admin/db-overview`.)

**2. Swagger API docs.** Visit `http://localhost:8000/docs` (or your Render URL
`/docs`). Click **Authorize**, log in, and call any endpoint to see live data.

**3. SQLite GUI (local).** Install **DB Browser for SQLite**
(<https://sqlitebrowser.org>, free) and open `backend/omnimarkit.db`. Browse/edit
every table visually.

**4. Command line (local SQLite):**
```bash
cd backend
sqlite3 omnimarkit.db
sqlite> .tables                       -- list all 30 tables
sqlite> .mode column
sqlite> .headers on
sqlite> SELECT email, role FROM users;
sqlite> SELECT * FROM recordings;
sqlite> .quit
```

**For Postgres in production:** use `psql "$DATABASE_URL"`, or a free GUI like
**TablePlus**, **DBeaver**, or **pgAdmin**, or the Neon/Supabase web table viewer.

---

## F. Custom domain (optional, free)

Both Vercel and Render let you attach a custom domain for free (you just pay for
the domain itself). Add it in each dashboard and update `FRONTEND_ORIGIN` /
`NEXT_PUBLIC_API_URL` accordingly.
