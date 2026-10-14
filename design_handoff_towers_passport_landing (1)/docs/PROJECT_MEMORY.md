# Towers Passport Landing Page — Project Memory

Entity: **ScanBuild1** (Paul & James, 50/50). Product: **Towers Passport**. Do not conflate with Scan4D or PHD.
Status label: **DRAFT — design approved in principle by Paul (13 Oct 2026); visual identity still a working draft pending formal approval.**

## Current stage (as at 13 Oct 2026)
**Stage 1 — Design: COMPLETE (in principle).** Next: **Stage 2 — GoHighLevel CRM/calendar setup** (Paul, offline). Then **Stage 3 — Calendar embed + full build** → **Stage 4 — Deploy (Genspark Code)**.

Read `docs/SESSION_HANDOFF.md` first in any new chat — it holds the decisions, open items and the next-session checklist.

## Files
- `Towers Passport Landing.html` — the landing page (asset: "Towers Passport Landing Page"). Mobile-first.
- `Towers Passport System & Motion Spec.html` — palette, type, motion spec, delivery notes F1–F12.
- `css/tp.css`, `js/tower.js` (shared tower geometry), `js/hero.js`, `js/story.js`, `js/app.js`. Cache-buster `?v=3` on all — bump it on every CSS/JS change.
- `assets/` — logos (`sb1-lockup-ondark.png` cut from supplied dark lockup), `assets/img/` imagery taken from the Towers Passport presentation (AI-generated, labelled Illustrative).

## Locked decisions (DECISION — Paul, 13 Oct 2026)
- Hero interaction: **Direction A · Displace**, point density **1.6** (saved in EDITMODE block).
- Layout, story morph, colourways, copy and section order: **approved, do not change**.
- Liability section reworked as 4-interval slice sequence on the cutaway image: **approved**.
- Booking: **Option A — embedded GoHighLevel calendar** (new, dedicated calendar — NOT the existing 30-min discovery call; must not point at the existing website).
- Hosting: **Option 2 — standalone site, deploy via Genspark**, GHL used for CRM/calendar only.
- Tracking code / chat widget: **TENTATIVE** — evaluate complexity + pros/cons before deciding.

## v4 revisions (14 Oct 2026, Paul's design notes) — DRAFT pending review
- Logo → `assets/sb1-lockup-yellow.png` (SB.1 with yellow "1", bg removed). Nav + footer.
- Hero: A radius halved (75px / 45px mobile); B = ×1.9 magnifier, ~28% smaller (108/74px), dense detail layer + CAD lines inside lens, pin labels revealed on hover. Density default 2.2 (range 1–3). Level-by-level opaque sweep + "Lxx · CAPTURING" tag. Six yellow pins with developer-relevant labels (illustrative).
- Story: Tweak A = point morph (existing) · Tweak B = image riser using three-stages.jpg (yellow riser reveals FORM → BUILT → CAPTURED, drops back between stages). `html[data-story]`.
- Problem image shifted to show ghost tower; Program cards lift + zoom 1.16; Why now: gaussian image beside head, yellow scroll riser on both timelines, big statement, Gold Coast night band with 4 stats (+13.2%).
- 3D lift tiles: outcomes, pilot numbers, FAQ (now a 3×2 tile grid).
- Liability: pins on one dashed datum line w/ leaders; hover image or tile to select; stats headline added (copy DRAFT: "Defects are common, costly and long-tailed — so your evidence has to be too.").

## v6 (14 Oct 2026)
- Story B riser zoomed: `.si-col` height 150%, top −6% (128%/−2% on mobile) — tower fills the stage.
- NEW section "Premium add-on · Reframe" between 02 Program and 03 Why now (`#reframe`, `js/reframe.js`). Source image: presentation slide 9 → `assets/img/reframe-slide.jpg` (static fallback). Slider needs two full-frame plates `assets/img/reframe-before.jpg` (bare shell) + `reframe-after.jpg` (furnished), same geometry — PENDING generation (awaiting Paul's OK). Until they exist, the static slide image shows.

## v9 (14 Oct 2026) — DECISION (Paul)
- All "Illustrative · AI-generated" image labels removed site-wide, plus the AI-imagery line in the footer disclaimer and the NAR source note. This overrides the brief's §8/§10 "label illustrative imagery" rule. ⚠ Flag for review: Reframe staged images and hero/story tower are AI-generated; consider whether ACL/advertising guidance needs any disclosure before go-live.
- Lift tiles extended to investment layers, creds, QBCC numbers, market stats, Reframe uses.

## Decisions locked 14 Oct 2026 (Paul)
- Spatial story = **B · Image riser**. Hero = **B · Focus lens** (C · 3D tower still under comparison). Density **3.0**.
- Stage 2 started: GHL calendar duplicated from SB1 discovery call, set to 60 min. Full setup guide in `docs/GHL_TOWERS_PASSPORT_SETUP.md` (calendar copy, custom fields, form, separate pipeline "SB1 · Towers Passport — Developers", workflows A–D, embed steps).
- Pending page change at embed time: "Thirty minutes" → "One hour" in section 09.

## FINAL LOCKS (Paul, 14 Oct 2026) — ready for build
- Hero = **C · 3D tower** (drag to orbit). Story = **B · Image riser**. Density 3.0.
- Booking: GHL calendar embedded in #demo (iframe id PydlAk7mIqZj3I7FTUKe; permanent link https://api.leadconnectorhq.com/widget/bookings/towers-passport-live-demo). Notifications run from calendar/form settings, NOT workflows. Guests enabled.
- Domain: towers-passport.scanbuild1.com.au (proposed); DNS at VentraIP — guide Paul through CNAME after deploy.
- Legal name: ScanBuild1. Privacy Policy DRAFT at `Privacy Policy.html` (needs ABN, email, review). Linked in footer.
- Share meta: title "Towers Passport · Multi-level Residential", desc "Every tower, sold and built in one spatial story.", image liability.jpg. Use absolute URLs for og:image at deploy.
- No chat widget; tracking deferred. Reframe slider unchanged (no AI note).
- Mobile: As-built/Splat toggle shrunk to a compact pill top-right under the readout.

## Hard rules carried from the brief
- Cobalt system, yellow accent only. Italic emphasis device on every H2.
- Never use the word "exclusive" for Real Horizons → "delivered in partnership with Real Horizons spatial technology".
- No forecast, valuation, ROI, use of funds, round terms or investor language on the page.
- Every figure must trace to the presentation / Investor Memorandum. Imagery labelled Illustrative.
- Page must render complete without JS and under prefers-reduced-motion (motion scoped to `html.motion`).
