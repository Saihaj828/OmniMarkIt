# OmniMarkIt — Project Overview

**OmniMarkIt** is a trust-first STEM tutoring marketplace. Credential-verified tutors, structured sessions, measurable outcomes.

> **WAT framework principles** (workflows/, tools/, agent orchestration) → parent workspace CLAUDE.md  
> **Submodule patterns** → see [backend/CLAUDE.md](backend/CLAUDE.md), [web/CLAUDE.md](web/CLAUDE.md), [mobile/CLAUDE.md](mobile/CLAUDE.md), [packages/shared/CLAUDE.md](packages/shared/CLAUDE.md)

---

## WAT Layer Mapping

OmniMarkIt uses the WAT framework defined in the parent workspace CLAUDE.md. Here is how each layer maps to this project:

| WAT Layer | OmniMarkIt Implementation |
|-----------|--------------------------|
| **Workflows** | `workflows/` — SOPs for backend flows, payments, tutor vetting, session lifecycle |
| **Agents** | code-reviewer, security-auditor, debugger — see `.claude/agents/` |
| **Tools** | `scripts/` — start.sh, stop.sh, deploy.sh, seed.sh |

---

## Current Phase: Phase 1 — Foundation

Backend API (FastAPI), PostgreSQL schema + Alembic migrations, JWT auth, tutor vetting pipeline.

Phase 0 (all 58 UI screens) is complete — `design/` is the source of truth for all UI and data contracts.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python + FastAPI + SQLAlchemy + Alembic |
| Database | PostgreSQL + Redis |
| Async tasks | Celery |
| Storage | AWS S3 + CloudFront |
| Video | Daily.co |
| Whiteboard | tldraw |
| Frontend | Next.js 14 + TypeScript + Tailwind + shadcn/ui |
| State | TanStack Query (server) + Zustand (client) |
| Realtime | Socket.io |
| Mobile | Expo (React Native) + TypeScript |
| Payments | Stripe + Stripe Connect |
| Infra | AWS Fargate + RDS |

---

## Directory Layout

```
backend/            # FastAPI app → see backend/CLAUDE.md
web/                # Next.js 14 frontend → see web/CLAUDE.md
mobile/             # Expo React Native → see mobile/CLAUDE.md
packages/shared/    # Shared TypeScript types/utils → see packages/shared/CLAUDE.md
brand_assets/       # Logo (OriginalLogo.png), brand guidelines PDF
design/             # 58 completed screen PNGs — source of truth
workflows/          # WAT framework SOPs
tools/              # WAT framework Python scripts
logs/               # Tool usage logs (gitignored)
.tmp/               # Disposable intermediates (gitignored)
```

---

## Personas & Access Control

Enforce `current_user.role` on every protected endpoint and route:

| Role | Portal | Access |
|------|--------|--------|
| `student` | `web/app/(app)/` | Browse tutors, book sessions, messaging, reviews, billing |
| `tutor` | `web/app/(app)/` | Profile, availability, sessions, earnings, vetting pipeline |
| `admin` | `web/app/admin/` | Verification queue, flagged sessions, disputes, user management |

---

## Agent Assignments

- **code-reviewer** — after writing significant code; review quality, patterns, security
- **security-auditor** — before any commit touching auth, payments, or PII
- **debugger** — when you hit a runtime error, stack trace, or unexpected behavior
- **Explore** — search the codebase before implementing something new

---

## MCP Tools

- **ALWAYS use GitHub MCP** (`mcp__github__*`) for all GitHub operations
- **ALWAYS use Playwright MCP** (`mcp__playwright__*`) for browser testing
  - Frontend: `http://localhost:3000` | API docs: `http://localhost:8000/docs`

---

## Slash Commands

- `/start` — kill ports 3000/8000, start backend + frontend
- `/stop` — stop dev servers
- `/test` — run full test suite across all layers

---

## Hard Rules (Non-Negotiable)

These apply everywhere — root to submodule:

1. **Monetary values in cents (INTEGER)** — never floats
2. **Timestamps in UTC (TIMESTAMPTZ)** — always
3. **All PKs are UUID** (`gen_random_uuid()`) — no sequential IDs exposed
4. **Never recompute `avg_rating`** in app code — read cached column; update via DB trigger
5. **Never delete a session** if `SESSION_FLAGS.legal_hold = TRUE` — enforce in app + FK
6. **Never store OAuth tokens in plain text** — AES-256 in `CALENDAR_CONNECTIONS`
7. **No raw SQL** — SQLAlchemy ORM + parameterized queries only
8. **Pydantic schema for every endpoint** — no unvalidated input to the DB
9. **No PII in logs** — no emails, names, phone numbers in log statements

---


## Context Management

Keep Claude's context focused — this directly affects response quality and cost.

**When to compact**: `/compact` — summarises history and continues. Use when the conversation grows long or you start a new sub-task.  
**When to clear**: `/clear` — starts completely fresh. Use when switching to an unrelated task.

**Loading context on demand** (don't load everything upfront):
- `@backend/CLAUDE.md` — backend patterns
- `@web/CLAUDE.md` — frontend patterns
- `@path/to/specific.py` — load a single file
- Type `#` at the prompt to choose a file from a picker

**Controlling what Claude searches**:
- `.claudeignore` skips `node_modules/`, `.next/`, `logs/`, `design/` (58 PNGs), `brand_assets/`, Alembic versions
- Keeps searches fast and prevents token waste on the 58 screen PNGs in `design/`

**Multi-agent isolation**:
- Use subagents (code-reviewer, security-auditor, debugger) to isolate context
- Each subagent starts with a clean slate — pass only the files it needs

---

## Skills

Custom slash commands live in `.claude/skills/`. Each skill is a folder with a `SKILL.md` file Claude executes when invoked.

- Invoke: `/skill-name` in the Claude Code prompt
- Add new skills: create `.claude/skills/<skill-name>/SKILL.md`
- See `.claude/skills/` for README and example

**OmniMarkIt skill ideas:**
- `/tutor-review` — security-auditor + code-reviewer on a new vetting endpoint
- `/migration-check` — verify an Alembic migration is safe before applying to prod
- `/session-flow` — Playwright test for full student→tutor booking flow

---

## Brand & Design

- **Colors**: Navy `#05102E`, Gold `#C49A2A`, Cream `#FFF2C2`
- **Typography**: Serif (headings), Sans (body), Mono (labels/data)
- **Brand mark**: 8-point star/compass
- **Logo + guidelines**: `brand_assets/`
- **Design philosophy**: `design/philosophy_meridian_authority.md`
- **All 58 screens**: `design/*.png`
