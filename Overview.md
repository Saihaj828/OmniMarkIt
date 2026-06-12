# OmniMarkIt — Project Overview (Plain-English Guide)

A simple, non-technical explanation of what this app is, how it works, what's
built, and what you should know. Hand this to anyone — no coding knowledge needed.

---

## 1. What this app is (the one-liner)

**OmniMarkIt is an online marketplace that connects students with verified
tutors** — like an "Uber for tutoring."

A student finds a tutor, books a lesson, pays, meets, and leaves a review.
A tutor gets verified, teaches, and gets paid. An admin keeps everyone safe.

Three types of users:
- **Students** — looking to learn
- **Tutors** — looking to teach and earn
- **Admins** — staff who verify tutors and handle problems

The whole product in one sentence: **Search → Book → Pay → Learn → Review**, with
**trust** (tutor verification + admin oversight) wrapped around it.

---

## 2. How it works — told as a story

The easiest way to explain it to someone is to walk through each person's journey.

### The student's journey
1. Signs up / logs in.
2. **Searches** for a tutor (filter by subject, price, rating).
3. Opens a tutor's **profile** — bio, subjects, star rating, real reviews.
4. **Books** a session: picks subject, date/time, length (30/60/90 min).
   Price is calculated automatically.
5. **Pays** (can use a promo code like `WELCOME10` for a discount).
6. At lesson time, opens the **session room** (where live video would be).
7. After the lesson, leaves a **review** (stars + comment).
8. Can also **message** the tutor, manage a **subscription plan**, or
   **file a dispute** if something went wrong.

### The tutor's journey
1. Signs up as a tutor → starts as "pending."
2. Goes through **vetting** (the trust check): uploads credentials, verifies ID,
   describes their teaching approach.
3. An admin **approves** them — only then do they appear in search.
4. Edits their **profile** (headline, bio, hourly rate, subjects).
5. Receives bookings; marks sessions **started**, then **completed**.
6. Watches **earnings** grow and **requests a payout** to withdraw money.
7. Replies to reviews and messages.

### The admin's journey
1. Logs into the **admin console**.
2. Reviews the **vetting queue** → approves or rejects new tutors.
3. Manages **users** (suspend / reactivate accounts).
4. Resolves **disputes** (and can issue refunds).
5. Reviews **flagged sessions**; can place a **legal hold** (locks a session so
   it can't be cancelled or deleted).

---

## 3. What is a "screen"?

A **screen** (or **page**) is **one full view the user looks at** — one thing
filling the browser/phone at a time (e.g. the login screen, the search screen).
When you click a button and the whole view changes, you've gone to a new screen.

There are **two different things people call "screens":**
- **Design screens (mockups)** = *pictures* of what a screen should look like.
  Just images. Nothing is clickable. They're the blueprint.
- **Built screens (real pages)** = *working code* you can click, type into, and
  use. These talk to the backend and do real things.

This project had **58 design mockups** (blueprints). The work was turning those
blueprints into **working pages**.

---

## 4. Are all 58 screens done? Honest answer: **No — the core is, not all of them.**

The **core marketplace is fully working**, built as **12 real pages** that
*combine* many of the 58 mockups (e.g., one session page covers payment + the
lesson room + the review, which were 3 separate mockups). Several side-screens —
onboarding wizards, the mobile app, and rare edge cases — are **not built yet**.

| Area | Built & working? |
|---|---|
| Landing page | ✅ Yes |
| Login / Register | ✅ Yes |
| Tutor search | ✅ Yes |
| Tutor profile + booking | ✅ Yes (combined into one page) |
| Student dashboard | ✅ Yes |
| Tutor dashboard (+ profile edit, earnings, vetting) | ✅ Yes |
| Session: pay + room + review + materials + flag + cancel | ✅ Yes (video room is a placeholder) |
| Messaging | ✅ Yes |
| Billing & plans | ✅ Yes |
| Disputes | ✅ Yes |
| Admin (vetting, users, disputes, flagged sessions) | ✅ Yes |
| Password reset | ❌ Not built |
| Trust & Safety info page | ❌ Not built |
| Full onboarding wizard (subject pick, Stripe setup, background check) | ⚠️ Partial — vetting steps exist on the tutor dashboard, not as a guided wizard |
| Profile settings / Notifications center | ⚠️ Partial — notifications show on the dashboard; no dedicated pages |
| Availability manager UI / Reviews page | ⚠️ Partial — backend works, simpler UI |
| Admin credential viewer / recording playback | ❌ Not built |
| Reschedule / Payment-failed flows | ❌ Not built |
| Dedicated safety screens (consent gate, report modal, etc.) | ⚠️ Partial — flagging works, screens simplified |
| Mobile app (6 screens) | ❌ Not built (web only for now) |

**How to say it simply:** *"The whole core product works end-to-end — sign up,
get verified, search, book, pay, teach, review, get paid, plus admin oversight.
About a dozen secondary screens (onboarding wizard, mobile app, password reset,
a few edge cases) are still design-only and not built yet."*

---

## 5. Key things to know

**It has two halves that talk to each other:**
- **Frontend** (`web/` folder) = what you *see and click*. Built with Next.js.
  Runs at `http://localhost:3000`.
- **Backend** (`backend/` folder) = the *brain and memory*. Built with FastAPI
  (Python). Runs at `http://localhost:8000`. Holds all data and rules.
- They talk through small messages (an "API"): the frontend asks, the backend answers.

**The database** = the app's memory. It has **28 tables** (think 28 spreadsheets:
users, sessions, payments, reviews, etc.). Uses SQLite by default (zero setup);
can switch to PostgreSQL for real production.

**Real vs. faked ("stubbed") — be upfront about this:** Some parts are built as
flows but plugged into a *fake* instead of a paid third-party service, so it
demos for free:
- **Payments (Stripe)** — "succeeds" instantly; no real card is charged.
- **Video lessons + whiteboard** — shown as a placeholder box.
- **Emails / notifications** — saved inside the app instead of actually emailed.
- **File uploads** — accepted as a link, not stored in cloud storage.

Everything else (accounts, search, booking, reviews, ratings, messaging,
vetting, disputes, admin) is **genuinely working**.

**How to run it:** unzip → `./start.sh` → open `http://localhost:3000`.
Log in with a demo account (password `password123` for all):

| Email | Who they are |
|---|---|
| `student@omnimarkit.com` | A learner |
| `tutor@omnimarkit.com` | An approved tutor |
| `pending@omnimarkit.com` | A tutor still being verified (shows the vetting form) |
| `admin@omnimarkit.com` | The staff / admin view |

**How we know it works:** the backend passed **27 of 27** live checks of the full
flow, and the frontend builds with **no errors**.

---

## 6. A 30-second demo script (if someone wants to see it live)

1. Log in as **student** → **Find Tutors** → open a tutor → **Book** a session →
   **Pay** (try promo `WELCOME10`).
2. Log in as **tutor** → dashboard → **Start**, then **Mark completed**.
3. Back as **student** → open the session → **leave a review** (watch the tutor's
   rating update).
4. As **tutor** → **Request payout**.
5. Log in as **admin** → **approve** the pending tutor, **resolve** a dispute,
   set a **legal hold** on a flagged session.

That covers the entire product in under a minute.
