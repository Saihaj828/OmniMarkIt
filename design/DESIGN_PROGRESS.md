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
| P3 | Tutor Profile (Public) | ✅ High | **DONE** | `P3_tutor_profile_public.png` | `render_P3.js` |
| P4 | Auth Login / Register | ✅ High | **DONE** | `P4_auth_login_register.png` | `render_P4.js` |
| P5 | Forgot / Reset Password | ⚠️ Medium | **DONE** | `P5_forgot_reset_password.png` | `render_P5.js` |
| P6 | Trust & Safety Info | ⚠️ Medium | **DONE** | `P6_trust_safety.png` | `render_P6.js` |
| **STUDENT LAYER** |
| S1 | Student Dashboard | ✅ High | **DONE** | `S1_student_dashboard.png` | `render_student_dashboard.js` |
| S2 | Tutor Search (logged-in) | ✅ High | **DONE** | `S2_tutor_search_loggedin.png` | `render_S2.js` |
| S3 | Tutor Profile (private view) | ✅ High | **DONE** | `S3_tutor_profile.png` | `render_S3.js` |
| S4 | Booking Flow | ✅ High | **DONE** | `S4_booking_flow.png` | `render_S4.js` |
| S5 | Payment Flow | ✅ High | **DONE** | `S5_payment_flow.png` | `render_S5.js` |
| S6 | Session Detail Page | 🚨 Critical | **DONE** | `S6_session_detail.png` | `render_S6.js` |
| S7 | Session Room | 🚨 Critical | **DONE** | `S7_session_room.png` | `render_session_room.js` |
| S8 | Messaging / Inbox | ✅ High | **DONE** | `S8_messaging_inbox.png` | `render_S8.js` |
| S9 | Post-Session Review | ✅ High | **DONE** | `S9_post_session_review.png` | `render_S9.js` |
| S10 | Billing & Plans | ✅ High | **DONE** | `S10_billing_plans.png` | `render_S10.js` |
| S11 | Profile & Settings | ⚠️ Medium | **DONE** | `S11_profile_settings.png` | `render_S11.js` |
| S12 | Notifications Center | ⚠️ Medium | **DONE** | `S12_notifications_center.png` | `render_S12.js` |
| **TUTOR LAYER** |
| T1 | Tutor Dashboard | 🚨 Critical | **DONE** | `T1_tutor_dashboard.png` | `render_tutor_dashboard.js` |
| T2 | Tutor Profile Editor | 🚨 Critical | **DONE** | `T2_profile_editor.png` | `render_T2.js` |
| T3 | Availability Manager | 🚨 Critical | **DONE** | `T3_availability_manager.png` | `render_T3.js` |
| T4 | Tutor Inbox | ✅ High | **DONE** | `T4_tutor_inbox.png` | `render_T4.js` |
| T5 | Session Detail (Tutor view) | 🚨 Critical | **DONE** | `T5_session_detail_tutor.png` | `render_T5.js` |
| T6 | Earnings & Payouts | 🚨 Critical | **DONE** | `T6_earnings_payouts.png` | `render_T6.js` |
| T7 | Reviews & Ratings | ⚠️ Medium | **DONE** | `T7_reviews_ratings.png` | `render_T7.js` |
| **ONBOARDING LAYER** |
| O1 | Onboarding Start | 🚨 Critical | **DONE** | `O1_onboarding_start.png` | `render_onboarding.js` |
| O2 | Subject Selection | 🚨 Critical | **DONE** | `O2_subject_selection.png` | `render_O2.js` |
| O3 | Credentials Upload | 🚨 Critical | **DONE** | `O3_credentials_upload.png` | `render_O3.js` |
| O4 | Availability Setup | 🚨 Critical | **DONE** | `O4_availability_setup.png` | `render_O4.js` |
| O5 | Teaching Approach | 🚨 Critical | **DONE** | `O5_teaching_approach.png` | `render_O5.js` |
| O6 | Stripe Onboarding | 🚨 Critical | **DONE** | `O6_stripe_onboarding.png` | `render_O6.js` |
| O7 | ID Verification | 🚨 Critical | **DONE** | `O7_id_verification.png` | `render_O7.js` |
| O8 | Background Check Status | 🚨 Critical | **DONE** | `O8_background_check.png` | `render_O8.js` |
| O9 | Verification Pending | 🚨 Critical | **DONE** | `O9_verification_pending.png` | `render_O9.js` |
| O10 | Approved / Rejected | 🚨 Critical | **DONE** | `O10_account_approved.png` | `render_O10.js` |
| **SESSION LIFECYCLE** |
| SL1 | Join Session Consent Gate | 🚨 Critical | **DONE** | `SL1_consent_gate.png` | `render_SL1.js` |
| SL2 | In-Session Report Modal | 🚨 Critical | **DONE** | `SL2_report_modal.png` | `render_SL2.js` |
| SL3 | End & Report Flow | 🚨 Critical | **DONE** | `SL3_end_session.png` | `render_SL3.js` |
| SL4 | Post-Session Safety Prompt | 🚨 Critical | **DONE** | `SL4_post_session_safety.png` | `render_SL4.js` |
| SL5 | Flag Confirmation | ⚠️ Medium | **DONE** | `SL5_flag_confirmation.png` | `render_SL5.js` |
| **EDGE CASES** |
| E1 | Cancel Session Modal | 🚨 Critical | **DONE** | `E1_cancel_session.png` | `render_E1.js` |
| E2 | Reschedule Flow | 🚨 Critical | **DONE** | `E2_reschedule_flow.png` | `render_E2.js` |
| E3 | Payment Failed | 🚨 Critical | **DONE** | `E3_payment_failed.png` | `render_E3.js` |
| E4 | Subscription Management | 🚨 Critical | **DONE** | `E4_subscription_management.png` | `render_E4.js` |
| E5 | Dispute Flow | 🚨 Critical | **DONE** | `E5_dispute_flow.png` | `render_E5.js` |
| **ADMIN LAYER** |
| A1 | Admin Dashboard | 🚨 Critical | **DONE** | `A1_admin_dashboard.png` | `render_admin.js` |
| A2 | Tutor Verification Queue | 🚨 Critical | **DONE** | `A2_verification_queue.png` | `render_A2.js` |
| A3 | Credential Viewer | 🚨 Critical | **DONE** | `A3_credential_viewer.png` | `render_A3.js` |
| A4 | Flagged Sessions Queue | 🚨 Critical | **DONE** | `A4_flagged_sessions.png` | `render_A4.js` |
| A5 | Recording Playback | 🚨 Critical | **DONE** | `A5_recording_playback.png` | `render_A5.js` |
| A6 | Dispute Management | 🚨 Critical | **DONE** | `A6_dispute_management.png` | `render_A6.js` |
| A7 | User Management | 🚨 Critical | **DONE** | `A7_user_management.png` | `render_A7.js` |
| **MOBILE** |
| M1 | Mobile Onboarding | ✅ High | **DONE** | `M1_mobile_onboarding.png` | `render_mobile.js` |
| M2 | Mobile Home | ✅ High | **DONE** | `M2_mobile_home.png` | `render_mobile.js` |
| M3 | Mobile Session Room | ✅ High | **DONE** | `M3_mobile_session.png` | `render_mobile.js` |
| M4 | Mobile Messages | ✅ High | **DONE** | `M4_mobile_messages.png` | `render_mobile.js` |
| M5 | Mobile Tutor Browse | ✅ High | **DONE** | `M5_mobile_browse.png` | `render_mobile.js` |
| M6 | Mobile Profile & Settings | ✅ High | **DONE** | `M6_mobile_profile.png` | `render_mobile.js` |

---

## Batch Log

| Batch | Date | Screens | Notes |
|-------|------|---------|-------|
| 1 | 2026-04-26 | P1, P2, S1, T1 | Foundation screens: landing, search, both dashboards |
| 2 | 2026-04-26 | S7, O1, A1 | Core patterns: session room, onboarding wizard, admin ops |
| 3 | 2026-04-27 | O2, O3, O4 | Onboarding flow: subject selection, credentials upload, availability calendar |
| 4 | 2026-04-27 | SL1, SL2, SL3 | Session lifecycle modals: consent gate, in-session report, end & review |
| 5 | 2026-04-27 | T2, T3, T6 | Tutor portal: profile editor, availability manager, earnings & payouts |
| 6 | 2026-04-27 | A2, A4, A6 | Admin ops: verification queue, flagged sessions, dispute management |
| 7 | 2026-04-27 | S3, S4, S5, S6 | Student flow: tutor profile view, booking wizard, payment checkout, session detail |
| 8 | 2026-04-27 | E1, E2, E3, E4, E5 | Edge cases: cancel modal, reschedule flow, payment failed, subscription, dispute |
| 9 | 2026-04-27 | O5, O6, O7, O8, O9, O10 | Onboarding completion: teaching approach, Stripe setup, ID verify, background check, pending, approved |
| 10 | 2026-04-27 | P3, P4, P5, P6 | Public + Auth: tutor profile public, login/register, forgot/reset password, trust & safety |
| 11 | 2026-04-28 | A3, A5, A7 | Admin ops: credential viewer, recording playback, user management |
| 12 | 2026-04-28 | S2, S8, S9, S10 | Student screens: logged-in search, messaging/inbox, post-session review, billing & plans |
| 13 | 2026-04-28 | S11, S12, T4, T5, T7 | Remaining student + tutor screens: profile/settings, notifications, tutor inbox, tutor session detail, reviews |
| 14 | 2026-04-28 | SL4, SL5, M1–M6 | Safety prompts + all 6 mobile screens (375×812) — **Phase 0 COMPLETE** |

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
