# OmniMarkIt — Phase 0 Design Progress

> **Resumption guide**: If starting a fresh session, read this file first. All render scripts live in `/tmp/`. Run them with `cd /tmp && node <script>.js`. Output goes to `/workspace/Tutoring/design/`.

---

## Rendering Toolkit

```
node-canvas 3.2.3 at /tmp/node_modules/canvas
System fonts: /usr/share/fonts/truetype/dejavu/
Run pattern: cd /tmp && node render_XXX.js
```

**Font registration (copy into every script):**
```javascript
const { createCanvas, registerFont } = require('/tmp/node_modules/canvas');
const SYS = '/usr/share/fonts/truetype/dejavu';
registerFont(path.join(SYS,'DejaVuSerif.ttf'),     { family:'Serif' });
registerFont(path.join(SYS,'DejaVuSerif-Bold.ttf'), { family:'Serif', weight:'bold' });
registerFont(path.join(SYS,'DejaVuSans.ttf'),       { family:'Sans' });
registerFont(path.join(SYS,'DejaVuSans-Bold.ttf'),  { family:'Sans', weight:'bold' });
registerFont(path.join(SYS,'DejaVuSansMono.ttf'),   { family:'Mono' });
registerFont(path.join(SYS,'DejaVuSansMono-Bold.ttf'), { family:'Mono', weight:'bold' });
```

**Color constants:**
```javascript
const NAVY='#05102E', NAVY2='#020C1F', CREAM='#FFF2C2', WHITE='#FFFFFF',
      LIGHT='#F6F5EF', GREY='#6B7280', GREY_LT='#E5E4DC', GOLD='#C49A2A',
      GREEN='#065F46', GREEN_BG='#ECFDF5', TEAL='#0D5E5E', TEAL_BG='#F0FAFA',
      BLUE='#1D4ED8', BLUE_BG='#EFF6FF', RED='#DC2626', RED_BG='#FEF2F2';
```

**Helper functions (copy into every script):**
```javascript
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}
function t(s,x,y,font,color,align='left'){ctx.font=font;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(s,x,y);ctx.textAlign='left';}
function shadow(on,color='rgba(5,16,46,0.08)',blur=18,oy=5){if(on){ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.shadowOffsetY=oy;}else{ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;}}
function star(cx,cy,sz,color,op=1){ctx.save();ctx.globalAlpha=op;ctx.fillStyle=color;const long=sz,short=sz*0.38,thin=sz*0.09;ctx.beginPath();ctx.moveTo(cx,cy-long);ctx.lineTo(cx+thin,cy-short);ctx.lineTo(cx+short,cy);ctx.lineTo(cx+thin,cy+short);ctx.lineTo(cx,cy+long);ctx.lineTo(cx-thin,cy+short);ctx.lineTo(cx-short,cy);ctx.lineTo(cx-thin,cy-short);ctx.closePath();ctx.fill();ctx.globalAlpha=1;ctx.restore();}
```

**Design philosophy:** "Meridian Authority" — navigational precision meets academic gravitas. Navy `#05102E` anchors, Cream `#FFF2C2` illuminates, Gold `#C49A2A` accents. Star/compass motif as brand logo throughout. See `/workspace/Tutoring/design/philosophy_meridian_authority.md`.

**Dashboard sidebar pattern (Student + Tutor portals):**
- Sidebar: x=0, w=240, full height, `NAVY2` fill, `GOLD` 1px right border
- Logo: `star(36,44,12,CREAM)` + "OmniMarkIt" at (56,52) bold 16px Serif CREAM
- Portal label at (36,70) 10px Mono CREAM 45% opacity
- Nav items from y=110, spacing 52px each
- Active item: CREAM highlight bg + GOLD 3px left accent bar
- User avatar + name at bottom (H-100 separator line, H-60 avatar)
- Main content: MX=256, MY=32

---

## Screen Status Table

| ID | Screen | Priority | Status | File | Script |
|----|--------|----------|--------|------|--------|
| **PUBLIC LAYER** |
| P1 | Landing / Hero | ✅ High | **DONE** | `01_landing_page.png` | `render_landing.js` |
| P2 | Tutor Search & Browse | ✅ High | **DONE** | `P2_tutor_search.png` | `render_search.js` |
| P3 | Tutor Profile (Public) | ✅ High | queued | — | — |
| P4 | Auth Login / Register | ✅ High | queued | — | — |
| P5 | Forgot / Reset Password | ⚠️ Medium | queued | — | — |
| P6 | Trust & Safety Info | ⚠️ Medium | queued | — | — |
| **STUDENT LAYER** |
| S1 | Student Dashboard | ✅ High | **DONE** | `S1_student_dashboard.png` | `render_student_dashboard.js` |
| S2 | Tutor Search (logged-in) | ✅ High | queued | — | — |
| S3 | Tutor Profile (private view) | ✅ High | queued | — | — |
| S4 | Booking Flow | ✅ High | queued | — | — |
| S5 | Payment Flow | ✅ High | queued | — | — |
| S6 | Session Detail Page | 🚨 Critical | queued | — | — |
| S7 | Session Room | 🚨 Critical | **DONE** | `S7_session_room.png` | `render_session_room.js` |
| S8 | Messaging / Inbox | ✅ High | queued | — | — |
| S9 | Post-Session Review | ✅ High | queued | — | — |
| S10 | Billing & Plans | ✅ High | queued | — | — |
| S11 | Profile & Settings | ⚠️ Medium | queued | — | — |
| S12 | Notifications Center | ⚠️ Medium | queued | — | — |
| **TUTOR LAYER** |
| T1 | Tutor Dashboard | 🚨 Critical | **DONE** | `T1_tutor_dashboard.png` | `render_tutor_dashboard.js` |
| T2 | Tutor Profile Editor | 🚨 Critical | queued | — | — |
| T3 | Availability Manager | 🚨 Critical | queued | — | — |
| T4 | Tutor Inbox | ✅ High | queued | — | — |
| T5 | Session Detail (Tutor view) | 🚨 Critical | queued | — | — |
| T6 | Earnings & Payouts | 🚨 Critical | queued | — | — |
| T7 | Reviews & Ratings | ⚠️ Medium | queued | — | — |
| **ONBOARDING LAYER** |
| O1 | Onboarding Start | 🚨 Critical | **DONE** | `O1_onboarding_start.png` | `render_onboarding.js` |
| O2 | Profile Setup | 🚨 Critical | queued | — | — |
| O3 | Subject Selection | 🚨 Critical | queued | — | — |
| O4 | Credentials Upload | 🚨 Critical | queued | — | — |
| O5 | Availability Setup | 🚨 Critical | queued | — | — |
| O6 | Stripe Onboarding | 🚨 Critical | queued | — | — |
| O7 | ID Verification | 🚨 Critical | queued | — | — |
| O8 | Background Check Status | 🚨 Critical | queued | — | — |
| O9 | Verification Pending | 🚨 Critical | queued | — | — |
| O10 | Approved / Rejected | 🚨 Critical | queued | — | — |
| **SESSION LIFECYCLE** |
| SL1 | Join Session Consent Gate | 🚨 Critical | queued | — | — |
| SL2 | In-Session Report Modal | 🚨 Critical | queued | — | — |
| SL3 | End & Report Flow | 🚨 Critical | queued | — | — |
| SL4 | Post-Session Safety Prompt | 🚨 Critical | queued | — | — |
| SL5 | Flag Confirmation | ⚠️ Medium | queued | — | — |
| **EDGE CASES** |
| E1 | Cancel Session Modal | 🚨 Critical | queued | — | — |
| E2 | Reschedule Flow | 🚨 Critical | queued | — | — |
| E3 | Payment Failed | 🚨 Critical | queued | — | — |
| E4 | Subscription Management | 🚨 Critical | queued | — | — |
| E5 | Dispute Flow | 🚨 Critical | queued | — | — |
| **ADMIN LAYER** |
| A1 | Admin Dashboard | 🚨 Critical | **DONE** | `A1_admin_dashboard.png` | `render_admin.js` |
| A2 | Tutor Verification Queue | 🚨 Critical | queued | — | — |
| A3 | Credential Viewer | 🚨 Critical | queued | — | — |
| A4 | Flagged Sessions Queue | 🚨 Critical | queued | — | — |
| A5 | Recording Playback | 🚨 Critical | queued | — | — |
| A6 | Dispute Management | 🚨 Critical | queued | — | — |
| A7 | User Management | 🚨 Critical | queued | — | — |
| **MOBILE** |
| M1 | Mobile Onboarding | ✅ High | queued | — | — |
| M2 | Mobile Home | ✅ High | queued | — | — |
| M3 | Mobile Session Room | ✅ High | queued | — | — |
| M4 | Mobile Messages | ✅ High | queued | — | — |
| M5 | Mobile Tutor Browse | ✅ High | queued | — | — |
| M6 | Mobile Profile & Settings | ✅ High | queued | — | — |

---

## Batch Log

| Batch | Date | Screens | Notes |
|-------|------|---------|-------|
| 1 | 2026-04-26 | P1, P2, S1, T1 | Foundation screens: landing, search, both dashboards |
| 2 | 2026-04-26 | S7, O1, A1 | Core patterns: session room, onboarding wizard, admin ops |

---

## Next Recommended Batches

**Batch 3** (critical onboarding): O2 Subject Selection, O3 Credentials Upload, O4 Availability Setup
**Batch 4** (session lifecycle): SL1 Consent Gate, SL2 Report Modal, SL3 End & Report
**Batch 5** (tutor ops): T2 Profile Editor, T3 Availability Manager, T6 Earnings
**Batch 6** (admin ops): A2 Verification Queue, A4 Flagged Sessions, A6 Disputes
**Batch 7** (student flow): S3 Tutor Profile, S4 Booking, S5 Payment, S6 Session Detail
**Batch 8** (edge cases): E1–E5 all
**Batch 9** (public + auth): P3, P4, P5, P6
**Batch 10** (mobile): M1–M6 all (375×812 canvas each)
**Batch 11** (remaining): S2, S8–S12, T4, T5, T7, O5–O10, A3, A5, A7
