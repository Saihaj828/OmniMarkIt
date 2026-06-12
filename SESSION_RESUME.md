# OmniMarkIt — Session Resumption Guide

> **HOW TO USE THIS FILE**: At the start of any new session, say:
> *"Read SESSION_RESUME.md at /workspace/Tutoring/SESSION_RESUME.md and continue Phase 0 design."*
> Claude will read this file and pick up exactly where we left off.

---

## Project Summary

**OmniMarkIt** — A trust-first STEM tutoring marketplace (Preply for college academics). Credential-verified tutors, structured sessions, measurable outcomes.

- **Root**: `/workspace/Tutoring/`
- **Design output**: `/workspace/Tutoring/design/`
- **Brand assets**: `/workspace/Tutoring/brand_assets/`
- **Design philosophy**: `/workspace/Tutoring/design/philosophy_meridian_authority.md`
- **Master progress table**: `/workspace/Tutoring/design/DESIGN_PROGRESS.md`
- **Memory file**: `/root/.claude/projects/-workspace/memory/project_tutoring_platform.md`

---

## Current Phase: Phase 0 — Design & Prototyping

**Goal**: Produce high-fidelity PNG mockups for all 58 screens before writing any code.
**Status**: 58 of 58 screens complete — **Phase 0 DONE!** Pending: move files from `/tmp/stage/` to `/workspace/Tutoring/design/` (need `chmod 777` fix — see bottom of file).

### Completed Screens

| File | Screen | Notes |
|------|--------|-------|
| `design/01_landing_page.png` | P1 Landing / Hero | Public-facing hero |
| `design/P2_tutor_search.png` | P2 Tutor Search | Filter sidebar + 9-card grid |
| `design/S1_student_dashboard.png` | S1 Student Dashboard | Sidebar + stats + sessions + progress |
| `design/T1_tutor_dashboard.png` | T1 Tutor Dashboard | Sidebar + earnings + bar chart + reviews |
| `design/S7_session_room.png` | S7 Session Room | 1440×900 video/whiteboard/chat |
| `design/O1_onboarding_start.png` | O1 Onboarding Start | 10-step wizard, step 1 form |
| `design/A1_admin_dashboard.png` | A1 Admin Dashboard | Top-nav only, tables, revenue |
| `design/O2_subject_selection.png` | O2 Subject Selection | Multi-select subject chips + level cards |
| `design/O3_credentials_upload.png` | O3 Credentials Upload | Drag-drop zones, upload states, verification timeline |
| `design/O4_availability_setup.png` | O4 Availability Setup | Weekly calendar grid, time slots, presets |
| `design/SL1_consent_gate.png` | SL1 Consent Gate | Pre-join modal, consent checkboxes, recording notice |
| `design/SL2_report_modal.png` | SL2 Report Modal | In-session report, issue type selector, textarea |
| `design/SL3_end_session.png` | SL3 End Session | Two-col: session summary + rating, tip, book-again |
| `design/T2_profile_editor.png` | T2 Tutor Profile Editor | Photo, bio, rate, teaching approach, education, video |
| `design/T3_availability_manager.png` | T3 Availability Manager | Stats row, settings, weekly grid with bookings, exceptions |
| `design/T6_earnings_payouts.png` | T6 Earnings & Payouts | Stats, bar chart, payout settings, transaction table |
| `design/A2_verification_queue.png` | A2 Verification Queue | Stats, filter tabs, 9-row queue, credential preview panel |
| `design/A4_flagged_sessions.png` | A4 Flagged Sessions | Red alert bar, severity-striped rows, session detail panel |
| `design/A6_dispute_management.png` | A6 Dispute Management | Stats, 8-row table, full dispute detail + resolution panel |
| `design/A3_credential_viewer.png` | A3 Credential Viewer | Left: doc list (5 items, status badges, active=transcript), right: live PDF viewer with toolbar, paused session transcript table, metadata panel |
| `design/A5_recording_playback.png` | A5 Recording Playback | Red context bar, video player (23:14/58:22, flagged moment marker on scrubber), transcript tab with flag highlight, right sidebar: session info, participants, flag detail, admin actions, legal hold notice |
| `design/A7_user_management.png` | A7 User Management | Stats row (5 KPIs), search + role filter tabs, 12-row user table with role/status badges, right detail panel: selected user with avatar, stats, activity timeline, admin actions |
| `design/P3_tutor_profile_public.png` | P3 Tutor Profile (Public) | Top nav, hero card with avatar/stats/tags, left About+Teaching+Credentials+Reviews, right booking widget + availability mini-cal |
| `design/P4_auth_login_register.png` | P4 Auth Login / Register | Tab switcher (Login active), social buttons, email/password form, sign-up card with role toggle + fields + strength meter |
| `design/P5_forgot_reset_password.png` | P5 Forgot / Reset Password | 3-step tracker, all 3 states shown: enter email, email sent (with countdown), set new password (strength bars + requirements) |
| `design/P6_trust_safety.png` | P6 Trust & Safety Info | Top nav, hero, 4 pillars, tutor verification steps, OmniMarkIt Guarantee NAVY card, session safety 6-feature grid, reporting escalation, stats bar, FAQ, CTA |
| `design/S3_tutor_profile.png` | S3 Tutor Profile (Student View) | Hero card, About/Teaching/Reviews col, Quick Book + availability col |
| `design/S4_booking_flow.png` | S4 Booking Flow | Step wizard, April calendar, time slots, session details, order summary |
| `design/S5_payment_flow.png` | S5 Payment Flow | Saved cards, card form, credits/promo, order summary, cancellation policy |
| `design/S6_session_detail.png` | S6 Session Detail | Countdown banner, checklist, materials, notes, tutor card, session history |
| `design/E1_cancel_session.png` | E1 Cancel Session Modal | Dark overlay modal, refund policy tiers, full-refund eligibility banner |
| `design/E2_reschedule_flow.png` | E2 Reschedule Flow | Current booking → May calendar → time slots, FROM/TO comparison card, policy |
| `design/E3_payment_failed.png` | E3 Payment Failed | Red alert banner, Stripe error code, fix options, card form, 14:32 countdown |
| `design/E4_subscription_management.png` | E4 Subscription Management | 3 plan cards (Starter/Scholar/Intensive), usage stats, invoice history table |
| `design/E5_dispute_flow.png` | E5 Dispute Flow | 5-step tracker, dispute type selector, claim textarea, timeline, OmniMarkIt Guarantee |
| `design/O5_teaching_approach.png` | O5 Teaching Approach | Teaching style cards, pace chips, session structure checkboxes, specializations, bio textarea |
| `design/O6_stripe_onboarding.png` | O6 Stripe Onboarding | Stripe Connect banner, account type, personal info form, bank account form, tax consent |
| `design/O7_id_verification.png` | O7 ID Verification | Why-verify card, doc type (3 cards), upload zones (front/back/selfie), privacy notice |
| `design/O8_background_check.png` | O8 Background Check | Checkr banner, what's included (4 items), pre-filled info, authorization checkboxes, timeline |
| `design/O9_verification_pending.png` | O9 Verification Pending | 4 status cards (credential/ID/BG/Stripe), ETA box, what-happens-next timeline, preview button |
| `design/O10_account_approved.png` | O10 Account Approved | Big NAVY congrats card, verification summary (4 green), profile completion, quick-start cards, CTA |
| `design/S2_tutor_search_loggedin.png` | S2 Tutor Search (logged-in) | Sidebar, search bar + active filter chips, left filter panel (sort/subject/price/rating/availability), 6 result cards with match%, save hearts, pagination |
| `design/S8_messaging_inbox.png` | S8 Messaging / Inbox | 3-col: conversation list (6 convos, unread badges), message thread (chat bubbles + session reminder card + compose), right sidebar (tutor card, upcoming session, shared files, quick actions) |
| `design/S9_post_session_review.png` | S9 Post-Session Review | Session summary card, 2-col: left = overall + category star ratings, written review textarea, tag chips, recommend selector, tip prompt, GOLD submit; right = guidelines, review impact, past reviews |
| `design/S10_billing_plans.png` | S10 Billing & Plans | Tab nav, current plan NAVY2 banner, 4 usage stat cards, 2-col: left = payment methods + transactions table; right = 3 plan cards (Starter/Scholar/Intensive, Scholar=current+highlighted), OmniMarkIt Guarantee |

### Phase 0 Complete!

All 58 screens rendered as of 2026-04-28. 13 final PNGs staged at `/tmp/stage/` — see fix command below.

**Next Phase: Phase 1 — Foundation** (Backend: FastAPI, PostgreSQL, auth, tutor vetting pipeline).

Full progress table: `design/DESIGN_PROGRESS.md`.

---

## Data Model Decisions (Phase 1+ Coding Reference)

### Normalization: 3NF + Strategic Denormalization

Baseline is **3NF** for all entity and junction tables. Deviations are deliberate and performance-justified — never ad-hoc.

### Deliberate Denormalizations — Always Honor These

| Field(s) | Table | Rule When Coding |
|---|---|---|
| `avg_rating`, `total_sessions`, `total_reviews` | `TUTOR_PROFILES` | Cached counters — update via DB trigger on INSERT to REVIEWS/SESSIONS, never compute inline |
| `student_unread_count`, `tutor_unread_count` | `CONVERSATIONS` | Increment on INSERT to MESSAGES, reset on read — never COUNT(*) |
| `timezone` | `TUTOR_AVAILABILITY` | Denormalized from TUTOR_PROFILES — sync on tutor timezone update |
| `student_id`, `tutor_id` | `PAYMENTS` | Duplicated from SESSIONS — avoids join on payment history queries |
| `TEXT[]` arrays | multiple | PostgreSQL arrays — always queried as a unit, no FK table needed |
| `JSONB metadata` | `NOTIFICATIONS`, `ADMIN_ACTIONS` | Polymorphic payload, schema varies by notification/action type |

### Hard Rules for Coding

- **Never** recompute `avg_rating` in application code — always read the cached column
- **Never** allow SESSION deletion if `SESSION_FLAGS.legal_hold = TRUE` — enforce in app layer + FK ON DELETE RESTRICT
- **Never** store OAuth tokens in plain text — AES-256 encrypt in `CALENDAR_CONNECTIONS`
- **No BCNF/4NF/5NF** — over-engineered for this schema
- **No analytics tables in OLTP schema** — use PostgreSQL materialized views for admin dashboard (Phase 6)
- Always store monetary values in **cents (INTEGER)**, never floats
- Always store timestamps in **UTC (TIMESTAMPTZ)**
- All PKs are **UUID** (`gen_random_uuid()`)

### All 28 Tables (Quick Reference)

```
AUTH & IDENTITY:    USERS · STUDENT_PROFILES · TUTOR_PROFILES
SUBJECTS:           SUBJECTS · TUTOR_SUBJECTS
VETTING:            TUTOR_VETTING · TUTOR_CREDENTIALS · TUTOR_ID_VERIFICATION · TUTOR_TEACHING_APPROACH
SCHEDULING:         TUTOR_AVAILABILITY · AVAILABILITY_EXCEPTIONS · CALENDAR_CONNECTIONS
SESSIONS:           SESSIONS · SESSION_MATERIALS · SESSION_FLAGS
PAYMENTS:           BILLING_PLANS · SUBSCRIPTIONS · PAYMENTS · PAYOUTS · PAYMENT_METHODS · PROMO_CODES · CANCELLATION_POLICIES
REVIEWS:            REVIEWS
MESSAGING:          CONVERSATIONS · MESSAGES
NOTIFICATIONS:      NOTIFICATIONS
DISPUTES & SAFETY:  DISPUTES
ADMIN:              ADMIN_ACTIONS
```

### Data Model Excel
`/workspace/Tutoring/design/omnimarkit_data_model.xlsx` (4 sheets: Entity Overview, Full Field Schema, Relationships, Enums)

---

## Rendering System

### How to run a script
```bash
cd /tmp && node render_XXX.js
```

### Font registration (required in every script)
```javascript
const { createCanvas, registerFont } = require('/tmp/node_modules/canvas');
const fs = require('fs');
const path = require('path');
const SYS = '/usr/share/fonts/truetype/dejavu';
registerFont(path.join(SYS,'DejaVuSerif.ttf'),      { family:'Serif' });
registerFont(path.join(SYS,'DejaVuSerif-Bold.ttf'), { family:'Serif', weight:'bold' });
registerFont(path.join(SYS,'DejaVuSans.ttf'),        { family:'Sans' });
registerFont(path.join(SYS,'DejaVuSans-Bold.ttf'),   { family:'Sans', weight:'bold' });
registerFont(path.join(SYS,'DejaVuSansMono.ttf'),    { family:'Mono' });
registerFont(path.join(SYS,'DejaVuSansMono-Bold.ttf'),{ family:'Mono', weight:'bold' });
```

> **IMPORTANT**: `/tmp/node_modules/canvas` is the ONLY working canvas installation. Variable fonts in `/root/.claude/skills/canvas-design/canvas-fonts/` CANNOT be parsed by canvas@3.2.3. Use DejaVu system fonts only.

### Color palette
```javascript
const NAVY='#05102E', NAVY2='#020C1F', CREAM='#FFF2C2', WHITE='#FFFFFF',
      LIGHT='#F6F5EF', GREY='#6B7280', GREY_LT='#E5E4DC', GOLD='#C49A2A',
      GREEN='#065F46', GREEN_BG='#ECFDF5', TEAL='#0D5E5E', TEAL_BG='#F0FAFA',
      BLUE='#1D4ED8', BLUE_BG='#EFF6FF', RED='#DC2626', RED_BG='#FEF2F2',
      AMBER='#D97706', AMBER_BG='#FFFBEB';
```

### Helper functions (copy into every script)
```javascript
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}
function t(s,x,y,font,color,align='left'){ctx.font=font;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(s,x,y);ctx.textAlign='left';}
function shadow(on,color='rgba(5,16,46,0.08)',blur=18,oy=5){if(on){ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.shadowOffsetY=oy;}else{ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;}}
function star(cx,cy,sz,color,op=1){ctx.save();ctx.globalAlpha=op;ctx.fillStyle=color;const long=sz,short=sz*0.38,thin=sz*0.09;ctx.beginPath();ctx.moveTo(cx,cy-long);ctx.lineTo(cx+thin,cy-short);ctx.lineTo(cx+short,cy);ctx.lineTo(cx+thin,cy+short);ctx.lineTo(cx,cy+long);ctx.lineTo(cx-thin,cy+short);ctx.lineTo(cx-short,cy);ctx.lineTo(cx-thin,cy-short);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.restore();}
```

### Canvas sizes used
| Screen type | W × H |
|-------------|--------|
| Landing page | 1440 × 2120 |
| Dashboard / full-page screens | 1440 × 1900 |
| Session Room | 1440 × 900 |
| Mobile screens (M1–M6) | 375 × 812 |

---

## Layout Patterns (reuse these)

### Dashboard sidebar (Student + Tutor portals)
```
Sidebar: x=0, w=240, full height, NAVY2 bg, GOLD 1px right border
Logo: star(36,44,12,CREAM) + "OmniMarkIt" bold 16px Serif at (56,52)
Portal label: (36,70) 10px Mono CREAM 45% opacity
Nav items: y=110, spacing 52px, active = GOLD left bar + highlight bg
User: separator at H-100, avatar circle at H-60
Main content: MX=256, MY=32
```

### Admin dashboard (A-layer)
```
Top nav only (no sidebar): 64px NAVY2, full-width tables
Alert bar: 44px AMBER_BG below nav
Content starts: y=108
```

### Session Room (S7 pattern)
```
Top bar: 56px NAVY2
Tool sidebar: x=0, w=44, LIGHT bg
Whiteboard: x=44, w=1016, WHITE bg with dot grid
Chat panel: x=1060, w=380, LIGHT bg with tabs
Bottom bar: 64px NAVY
```

### Onboarding wizard (O-layer)
```
Left steps panel: x=0, w=360, NAVY2 bg, GOLD right border
Step list: y=172, spacing 88px, active step = GOLD circle + highlight
Right content: x=384, full-height form
Progress bar: horizontal, GOLD fill, 10px height
```

---

## Design Philosophy: "Meridian Authority"

Navigational precision meets academic gravitas. Every screen feels like a well-charted instrument — authoritative, trusted, precise.

- **Primary**: Navy `#05102E` (deep trust anchor)
- **Accent**: Gold `#C49A2A` (achievement, verification)
- **Highlight**: Cream `#FFF2C2` (illumination)
- **Brand mark**: 8-point star/compass — used in logo, decorative overlays, section markers
- **Typography hierarchy**: Serif (headings) → Sans (body) → Mono (labels, data, code)
- **Cards**: white on LIGHT bg, subtle shadow (`rgba(5,16,46,0.07)` blur=14)
- **Rounded corners**: 6–8px for cards, 4px for chips/badges, 18–20px for pill buttons

---

## Tech Stack (for when coding starts — Phase 1+)

| Layer | Choice |
|-------|--------|
| Backend | Python + FastAPI |
| DB | PostgreSQL + Redis |
| Tasks | Celery |
| Storage | AWS S3 + CloudFront |
| Video | Daily.co |
| Whiteboard | tldraw |
| Frontend | Next.js 14 + Tailwind + shadcn/ui |
| State | TanStack Query + Zustand |
| Realtime | Socket.io |
| Mobile | Expo (React Native) |
| Payments | Stripe + Stripe Connect |
| Infra | AWS Fargate + RDS |

---

## All 58 Screens — Quick Reference

```
PUBLIC (P1–P6):      P1✅ P2✅ P3✅ P4✅ P5✅ P6✅
STUDENT (S1–S12):    S1✅ S2✅ S3✅ S4✅ S5✅ S6✅ S7✅ S8✅ S9✅ S10✅ S11✅ S12✅
TUTOR (T1–T7):       T1✅ T2✅ T3✅ T4✅ T5✅ T6✅ T7✅
ONBOARDING (O1–O10): O1✅ O2✅ O3✅ O4✅ O5✅ O6✅ O7✅ O8✅ O9✅ O10✅
SESSION LIFECYCLE:   SL1✅ SL2✅ SL3✅ SL4✅ SL5✅
EDGE CASES (E1–E5):  E1✅ E2✅ E3✅ E4✅ E5✅
ADMIN (A1–A7):       A1✅ A2✅ A3✅ A4✅ A5✅ A6✅ A7✅
MOBILE (M1–M6):      M1✅ M2✅ M3✅ M4✅ M5✅ M6✅
```
**58/58 screens complete — Phase 0 DONE!** ✅

Full detail with file paths: `design/DESIGN_PROGRESS.md`

---

## Git

Repo initialized at `/workspace/Tutoring/`. Auto-commit cron runs every 90 minutes while a Claude session is active. To manually commit:
```bash
cd /workspace/Tutoring && git add -A && git commit -m "design: <description>"
```

To push to GitHub (once remote is added):
```bash
git remote add origin <your-github-url>
git push -u origin main
```

---

*Last updated: 2026-04-28 — Batches 13+14 complete (S11, S12, T4, T5, T7, SL4, SL5, M1–M6) — 58/58 screens done — Phase 0 COMPLETE*

## ⚠️ ACTION REQUIRED: Move staged PNGs

The design directory lost write permissions this session. All 13 final PNGs are rendered and ready at `/tmp/stage/`. Run this one command to move them in:

```bash
chmod 777 /workspace/Tutoring/design && cp /tmp/stage/*.png /workspace/Tutoring/design/ && chmod 777 /workspace/Tutoring/design/*.png
```

Then run the git commit:

```bash
cd /workspace/Tutoring && git add -A && git commit -m "design: Batches 13+14 — Phase 0 complete (58/58 screens)"
```

## Rendering Environment (macOS)

Previous sessions ran on Linux with `/tmp/node_modules/canvas` + DejaVu fonts. This session runs on macOS with:
- **Canvas**: `@napi-rs/canvas` installed at `/tmp/omnimarkit/node_modules/`
- **Fonts**: `GlobalFonts.loadSystemFonts()` — use `Georgia` (Serif), `Arial` (Sans), `Courier New` (Mono)
- **Run scripts**: `cd /tmp/omnimarkit && node render_XXX.js`
- **Output path**: `/Volumes/Documents/AgenticWorkflow/Tutoring/design/`
- **Key note**: `ctx.roundRect()` with object-form radii fails — use the `rr()` helper for all rounded rects; use `ctx.fillRect()` for thin colored bars
