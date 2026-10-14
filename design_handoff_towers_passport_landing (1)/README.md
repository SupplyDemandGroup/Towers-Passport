# Handoff: Towers Passport — Developer Landing Page (ScanBuild1)

> Entity: **ScanBuild1**. Not Scan4D, not PHD. Product: **Towers Passport**.
> Status: **Design approved (Paul, 14 Oct 2026).** Visual identity is still a working draft pending formal brand approval. See delivery notes F1–F12 in `Towers Passport System & Motion Spec.html`.
> Next stages: GoHighLevel calendar embed (see `docs/GHL_TOWERS_PASSPORT_SETUP.md`), then build and deploy in **Genspark Code** (standalone site, domain TBC, e.g. `passport.scanbuild1.com.au`).

---

## Overview
A single-page, mobile-first landing page. It's the front door a multi-level residential developer opens on their phone after a cold call, referral or SMS. The page has **one job: book a live demo.**

It tells the Towers Passport story: one spatial model across three stages of a tower's life, **FORM → BUILT → CAPTURED**. It's built around interactive canvas and WebGL moments (hero point cloud, scroll-driven image riser, Reframe before/after slider, liability interval slices). It's deliberately shallow on commercial detail: the page is a hook, not the pitch.

## About the Design Files
The files in this bundle are **design references built in HTML**: working prototypes that show the intended look, motion and behaviour. They are a precise spec, not drop-in production code. Recreate the design in the target environment.

- **No codebase exists yet.** Recommended stack: **Astro** (or Next.js static export) with plain CSS or CSS modules.
- **Port the animation modules as-is** into client-only islands. `tower.js`, `hero.js`, `hero-3d.js`, `story-b.js` and `reframe.js` are dependency-free vanilla JS (`hero-3d.js` lazy-loads three.js r149) and already tuned.
- Hardening this HTML/CSS/JS and shipping it as a static site is an acceptable route if speed matters more than framework conventions.
- **Remove** the `aside.tweaks` panel and all `__edit_mode_*` postMessage code. Bake in the locked choices listed below.

## Fidelity
**High-fidelity.** Colours, type, spacing, copy, imagery and motion are final. Match them exactly. Copy and section order are approved. **Do not change copy, add sections or invent figures.**

---

## LOCKED DECISIONS (bake these in, drop the alternatives)
| Item | Locked value | Remove |
|---|---|---|
| Hero | **C · 3D tower** (`hero-3d.js`, drag to orbit), default on load. Mobile: tower fills the top 60svh, copy below, centred As-built/Splat pill + "Interactive 3D · swipe sideways to turn · tap a yellow pin" cue, readout hidden | Focus lens (`hero.js`) is kept only as the fallback if WebGL or three.js fails |
| Point density | **3.0** (×15,000 desktop = 45k points; ×7,000 mobile = 21k). Profile on a mid-range phone and cap mobile at ~12k if it drops below 60fps | — |
| Spatial story | **B · Image riser** (`story-b.js`, `html[data-story="b"]`) | `story.js` (point morph A) and `#storyCanvas` |
| "Illustrative / AI-generated" image labels | **Removed site-wide** (Paul's decision). ⚠ Recommend keeping one small "AI-staged example" note on the Reframe slider; ask Paul before go-live | — |
| Booking | **Embedded GHL calendar is DONE** in `#demo`: iframe `https://api.leadconnectorhq.com/widget/booking/PydlAk7mIqZj3I7FTUKe` + `form_embed.js`. It lazy-loads near the section and passes UTM params through. If the iframe stays hidden for 10s, it falls back to a button pointing at the permanent link `https://api.leadconnectorhq.com/widget/bookings/towers-passport-live-demo`. Notifications run from calendar/form settings, not workflows. Guests are enabled. | — |
| Share meta | Title "Towers Passport · Multi-level Residential", description "Every tower, sold and built in one spatial story.", image `liability.jpg`. **og:image must use an absolute URL at deploy** | — |
| Domain | `towers-passport.scanbuild1.com.au`. DNS is with VentraIP: add a CNAME to the Genspark host after deploy | — |
| Privacy | `Privacy Policy.html` (DRAFT: needs ABN and contact email), linked in the footer. Legal name: ScanBuild1 | — |
| Chat / tracking | None at launch | — |

---

## Global architecture
```
<html class="js [motion]" data-hero="focus" data-story="b">
  .rail         fixed 2px scroll-progress bar (z 60)
  header.nav    fixed 64px nav (z 50)
  main
    section.hero               Hero (Focus-lens point cloud; optional 3D tower)
    section.story#story        Spatial story (pinned scroll, image riser)
    section#problem            01 The problem
    section.program#program    02 The program
    section.reframe#reframe    + Premium add-on · Reframe (before/after slider)
    section#why-now            03 Why now (+ statement + .gc Gold Coast market band)
    section#developer          04 For the developer (+ .lia#liability Stage 2 liability block)
    section.why#why            05 Why ScanBuild1
    section#investment         06 Investment
    section.pilot#pilot        07 Founding pilot
    section#faq                08 Straight answers
    section.cta#demo           09 Book a demo (GHL calendar goes here)
  footer.foot
  .sticky-cta   mobile-only fixed bottom bar (z 55)
```

### Non-negotiable rendering rule
**Motion must never hide content.** The page must render complete:
- with JS disabled
- in link previews and static screenshots
- under `prefers-reduced-motion`

How the prototype achieves this:
- The inline head script adds `.js`, and adds `.motion` only if JS and canvas are available and reduced motion is **off**.
- Every canvas section has a static `<img>` fallback, and all text is in the DOM.
- All motion styles are scoped under `html.motion`. Fallback images are hidden only when `.motion` is set.
- Nothing is faded in from `opacity:0` by JS. Only decorative bars, slices and pins animate.
- Animation loops check `getBoundingClientRect` every frame. **Do not use IntersectionObserver**: it misreports inside embedded previews and caused blank sections earlier.

### Layout system
- `.wrap`: `max-width:1240px; margin:0 auto; padding:0 var(--pad)`
- `--pad`: 20px on mobile, 40px from 760px
- `--sec` (section vertical padding): 72px on mobile, 120px from 760px, 150px from 1200px
- Breakpoints (min-width, mobile-first): 600, 760, 900, 1000, 1080, 1100, 1200px
- Single column on mobile. **Never a horizontally scrolling table**: tables restack into cards.
- Primary test viewport is **430×932**. The hero headline and primary CTA must sit above the fold.

---

## Design Tokens

### Colour (nine-swatch ScanBuild1 palette)
| Token | Name | Hex | Role |
|---|---|---|---|
| `--cobalt` | Cobalt Blue | `#004AAD` | Brand voice; selected states; "answer" row |
| `--deep` | Deep Cobalt | `#003070` | Footer, CTA base, ramp floor |
| `--azure` | Azure Grey | `#253238` | Panels (used at 55–60% alpha) |
| `--slate` | Slate Steel | `#5B7B8A` | Borders, sources, inert labels |
| `--surge` | Cobalt Surge | `#1A7CFF` | Focus rings, live state, scan bars |
| `--sky` | Sky Current | `#6CA7F9` | Tech italic emphasis, outline stroke, data |
| `--ice` | Ice Veil | `#A8CBFD` | Eyebrows, readouts, highlights |
| `--mist` | Signal Mist | `#F4F7F8` | Primary text |
| `--yellow` | Accent Yellow | `#F2CB07` | **Accent only:** CTA, section number, one key metric per section, pins, active step |

**Derived values** (flagged F1):
- `--ground #011A40` (page base)
- `--ground-2 #02224F`
- `--panel rgba(37,50,56,.55)`
- `--line rgba(91,123,138,.32)`
- `--line-strong rgba(108,167,249,.45)`
- `--text-2 #B7C6CE`
- Surfaces: `#011638`, `#01143A`
- Hover fill: `#022150`
- Text on yellow: `#0B1A2E`

**Rules:**
- Blue means technology and data. Yellow means commercial meaning. Never swap them.
- About one yellow element per section.
- No magenta, cyan or gold-primary anywhere.

**Gradients:**
- Geometry: `#1A7CFF → #6CA7F9 → #A8CBFD`
- Rail: `#004AAD → #1A7CFF 40% → #6CA7F9 75% → #A8CBFD`
- Point-cloud height ramp (base → crown): `#003070 → #004AAD → #1A7CFF → #6CA7F9 → #A8CBFD → #F4F7F8`

### Typography
Google Fonts: **Chakra Petch** (500/600/700, italic 500/600), **IBM Plex Sans** (300/400/500), **IBM Plex Mono** (400/500). This pairing is flagged F2.

| Role | Spec |
|---|---|
| H1 | Chakra Petch 600, `clamp(40px,6.4vw,92px)`, lh 1.0, −.01em |
| H2 | Chakra Petch 600, `clamp(32px,4.6vw,66px)`, lh 1.04 |
| H3 | Chakra Petch 600, `clamp(22px,2vw,28px)`, lh 1.15 |
| Emphasis | Chakra Petch italic 500. `em.y` yellow = commercial; `em.b` Sky = technology. **Every H2 uses one.** |
| Lede | Plex Sans 300, `clamp(17px,1.5vw,20px)`, `--text-2`, max 56ch |
| Body | Plex Sans 300, 16px (15px in cards), lh 1.6 |
| Eyebrow | Plex Mono 500, 12px uppercase, .18em, Ice; 18×1px Slate leading rule; number in yellow `<b>` |
| Mono labels / sources | Plex Mono 400–500, 10.5–12px; sources 11px Slate |

**Outline → solid grammar** (F3):
- `.outline`: transparent fill with `-webkit-text-stroke:1.2px #6CA7F9`. Means not yet built.
- `.half`: fills from the base at 52%. Means rising.
- `.solid`: Mist. Means as-built.

### Radius, borders, shadows, motion
- **Radius:**
  - 2px for tags
  - **4px** for cards, panels, images and inputs
  - 6px for the form and Reframe frame
  - **999px** for pills: buttons, badge, segmented controls
- **Shadows:**
  - Primary CTA hover: `0 10px 40px -10px rgba(242,203,7,.55)`
  - Focus-visible: `outline:2px solid #1A7CFF; outline-offset:3px`
- **Easing:**
  - `--ease-out: cubic-bezier(.16,1,.3,1)`
  - `--ease-io: cubic-bezier(.65,0,.35,1)`

### 3D "lift" tile (shared hover pattern)
Used on these tile groups:
- 04 outcomes
- liability QBCC numbers
- Gold Coast market stats
- Reframe uses
- 05 credentials
- 06 payment layers
- 07 pilot numbers
- 08 FAQ (3×2 grid at ≥1100px)

```css
.lift{ transition: transform .5s var(--ease-out), box-shadow .5s, background .35s, opacity .35s }
.lift::after{ inset 0 2px 0 var(--yellow) top edge, opacity 0 → 1 on hover }
@media (hover:hover){
  .lift:hover{ transform: perspective(900px) translateY(-10px) translateZ(24px) rotateX(4deg);
    background: linear-gradient(160deg, rgba(0,74,173,.6), rgba(2,33,80,.95));
    box-shadow: 0 46px 70px -28px rgba(0,0,0,.75), 0 22px 60px -24px rgba(26,124,255,.6), 0 0 0 1px rgba(26,124,255,.55) }
  .tiles:hover .lift:not(:hover){ opacity:.5 }
}
```
Tiles are separate bordered cards with a 10–16px gap. On touch devices there's no hover, so tiles stay flat.

---

## Sections (exact copy lives in the HTML; key specs here)

**Nav**
- Fixed, 64px tall.
- After scrollY > 24: background `rgba(1,26,64,.78)` with `blur(14px)` and a hairline.
- Logo: `assets/sb1-lockup-yellow.png` (SB.1 with yellow "1", transparent), 36px tall. "TOWERS PASSPORT" mono label from 760px.
- Links shown from 1080px: Story · Program · Reframe · Investment · Pilot.
- CTA: "Book a live demo".

**Hero**
- 100svh tall: dot grid, radial glows, canvas, scrim.
- Badge pill: "TOWERS PASSPORT · MULTI-LEVEL RESIDENTIAL".
- H1: `Every tower, <span.outline>sold</span> and built in <em.y>one spatial story.</em>`
- CTAs: "Book a live demo →" (primary) and "See one model, three stages" (ghost).
- Meta line ends "…Delivered in partnership with Real Horizons spatial technology · 50% Aboriginal-owned · Gold Coast, Queensland".

*Focus lens* (`hero.js`):
- Shared seeded tower (`tower.js`). Rotation 0.10 rad/s, pointer adds ±0.12 rad yaw.
- **Lens:** radius 108px desktop / 74px mobile, ×1.9 magnification. Inside the lens, a 26k-point detail layer (Sky → Signal Mist) plus magnified CAD slab and mullion lines. Outside the lens, points are larger and dimmer ("unresolved").
- **Lens chrome:** ring, 36 tick marks, label `×1.9 · Lxx · RESOLVED`.
- **Capture sweep:** rises **level by level** (dwell, then step), on an ~11.8s loop. Opaque Ice plane with a Surge fill and the current-slab outline in white, plus the tag `Lxx · CAPTURING`.
- **15 yellow pins** pop as the sweep passes. In lens mode a label shows only when the pin sits inside the lens. Labels:
  - L00 Lobby · Neighbourhood layer
  - L02 Podium · Amenity walkthrough
  - L04 Pre-formwork
  - L06 Pre-plumbing
  - L08 Slab edge · design vs scan
  - L10 Apt 1002 · furnished walkthrough
  - L12 Services
  - L14 Pre-gyprock
  - L17 Apt 1704 · real view
  - L19 Progress · buyer update
  - L22 Balustrade · defect evidence
  - L24 Facade · AI-flagged, confirmed by a builder
  - L26 Reframe
  - L28 Sub-penthouse · live availability
  - L30 Crown · as-built twin
  - **Label wording awaits Paul's approval.**
- Readout, top-right: MODEL TP-01 / POINTS / CAPTURE Lxx/30 / MODE.

*Option C · 3D tower* (`hero-3d.js`, three.js r149 lazy-loaded from unpkg):
- **Finished tower:**
  - Box core with AI-generated photoreal facade textures (`assets/tex/front|side.jpg`) plus emissive lit-window maps
  - 31 slim white rounded slab bands with glass balustrades
  - Side blade walls and a curved white crown sail
  - Podium with roof-garden texture and lit lobby; **no trees**
- **Lighting:**
  - Warm low dusk key light with PCF soft shadows
  - Cool sky fill and cobalt rim light
  - PMREM dusk environment for reflections (sun glow, clouds, ocean, city-light horizon)
  - Fog, ACES tone mapping, exposure .94
- **As-built ⇄ Splat:** a yellow riser plane rises and clips the solid away, revealing a shader-based branded splat cloud (and back). Auto-plays every ~5–6.5s, with an "As-built / Splat" pill toggle.
- **Controls:**
  - Drag horizontally to orbit
  - Drag vertically to tilt (mouse only, clamped to .03–1.05 rad)
  - Auto-spin after 2.2s idle
  - Touch: horizontal drag rotates, vertical swipe scrolls the page (`touch-action:pan-y`)
- **Pins:** 15 pins fixed to the model and hidden when facing away. Labels on hover or tap, plus an idle cycle every 3.2s.

**Spatial story (locked B · image riser)**
- 420vh pinned track with a sticky 100svh stage.
- The tower column is cropped from `three-stages.jpg`: a 294%-wide image offset to `--sx:-12.5% / -98% / -184%` per stage. The column is height 150%, top −6% (128% / −2% on mobile).
- Each third of scroll: a yellow riser bar rises from 74% to 4% and reveals that stage's tower with `clip-path: inset(edge% 0 0 0)`. Between stages the bar drops back to the base ("NEXT INTERVAL").
- Tag shows `DESIGN RISING / SCANNING / CAPTURING · NNN%`.
- Stage tabs FORM (outline), BUILT (half), CAPTURED (solid). The active label turns yellow, a 2px progress bar runs along it, and tapping a tab scrolls to that stage.

**01 Problem**
- Image `problem-site.jpg`, `object-position:80% 50%`, left fade feathered across 0→18%.
- Stats: **100–120%** (yellow), 2–3 yrs, 12–18%.

**02 Program**
- Three cards: FORM, BUILT, CAPTURED.
- On hover the card lifts −8px, its image scales 1.16, a yellow top edge appears, and the sibling cards dim to .62.

**Reframe** (between 02 and 03)
- H2: "Restyle any room with *a sentence.*"
- Typed prompt pill with the "REFRAME" chip.
- Before/after slider, 16:9 (4:5 on mobile), using `reframe-before.jpg` (bare shell) and `reframe-after.jpg` (staged). Same room geometry in both: one balcony opening and one coastline view.
- The pointer position sets `clip-path: inset(0 X% 0 0)` on the before layer. The yellow line and knob follow at lerp 0.18.
- A native range input sits over the image for touch and keyboard. A one-time intro sweep plays on entry (88 → 12 → 50).
- Tags: "As captured · bare shell" / "Reframed · AI staging" / "Geometry locked · same scan".
- Static fallback: `reframe-slide.jpg`.
- Below: **83%** statistic and three lift tiles (Display units / Remaining stock / Resales). Source: NAR 2025.

**03 Why now**
- `gaussian.jpg` beside the heading.
- Two timelines (technology; portals) with a **yellow riser that walks each entry as you scroll**.
- Large statement: "Buyers will expect *3D by default.*"
- Then the `.gc` band: `gold-coast-night.jpg` at opacity .84, inset top 14%, position 55% 38%. Headline: "The Gold Coast is building upward — *faster than anywhere in Queensland.*" Four lift-tile stats: 896 · **82** · 88% · +13.2%.

**04 Developer + Liability**
- Four outcome lift tiles.
- **Liability block:** `liability.jpg` with four clip-path slices over the glass panes:
  - pre-formwork / pre-plumbing / pre-gyprock / pre-fit-off
  - auto-cycle 3.2s each
  - **hovering anywhere on the image or a tile selects that slice**
  - pins sit on **one dashed datum line** at 10%, with leader lines to each slice
- Headline over the stats: "Defects are common, costly and long-tailed — *so your evidence has to be too.*" (draft copy, awaiting approval)
- Four QBCC lift tiles: 5,771 · **71%** · $27m · 6y 6m.

**05 Why ScanBuild1**
- Provider comparison table, which restacks into cards on mobile. The ScanBuild1 row is the cobalt-gradient "answer".
- Four credential lift tiles.
- Integration list.
- **Never use the word "exclusive."**

**06 Investment**
- Three payment-layer lift tiles. Their 2px underline bars draw in sequence on scroll.
- Class selector Boutique / Mid / High, which updates the amounts and the fee-mix bar. Default is Mid.
- Data: Boutique $30k / $6k×34 / $0.34m / $0.59m / 0.82% · Mid $75k / $13k×49 / $1.43m / $2.15m / 0.72% · High $125k / $18k×64 / $3.85m / $5.11m / 0.63%. AUD excl. GST.

**07 Pilot**
- Lift tiles: 2 / **0.25%** / 2–3.
- "Founding places close once both are signed — *target mid-February 2027.*"

**08 FAQ**
- Six Q&A lift tiles: 1 column, then 2 columns from 760px, then 3 from 1100px.
- FAQ copy awaits confirmation (F10).

**09 Book a demo**
- H2: "Let's walk through your tower — `<span.outline>before it exists.</span>`"
- Three numbered steps.
- **GHL calendar embed** goes in the branded panel (`rgba(37,50,56,.6)`, line-strong border, radius 6px). It needs:
  - a loading state
  - an "Open the booking page" fallback link
  - `utm_source` passed through to the hidden Source field

**Footer**
- Logo, the line "From the first sale to the last strata meeting — *one spatial story.*", and disclaimers.
- **Add a Privacy Policy link** (required, because the calendar collects personal information).

**Sticky mobile CTA** (below 760px only)
- Contents: "2 founding places / Towers Passport pilot" with a "Book the demo" button.
- Shows when the hero bottom is above 80px **and** #demo is off-screen.
- The body gets `padding-bottom:76px`.

---

## State
All client-side, with no data fetching except the GHL iframe:
- `heroMode` (focus | 3d), `density` (3)
- `storyProgress` → `stage` 0–2
- Reframe `pos` 0–100, with a user-interaction flag that stops the intro sweep
- `liabilityIndex` 0–3 and auto-play flag
- Timeline `--p` per list
- `towerClass` (boutique | mid | high)
- `navScrolled`, `stickyVisible`

## Compliance (hard rules)
- No word "exclusive" for Real Horizons. Use: "delivered in partnership with Real Horizons spatial technology".
- No forecast, valuation, ROI, use of funds, round terms or investor language.
- Every figure traces to the Towers Passport presentation. Keep every source line verbatim.
- Consent wording for the GHL form is in `docs/GHL_TOWERS_PASSPORT_SETUP.md` §3b. It needs the legal entity name and a Privacy Policy URL.

## Assets
| File | Use | Source |
|---|---|---|
| `assets/sb1-lockup-yellow.png` | Nav + footer logo | Supplied SB.1 yellow-"1" lockup, background removed. Replace with the vector master when available. |
| `assets/img/hero-tower.jpg` | Hero fallback + og:image | Presentation p.1 (AI-generated) |
| `assets/img/three-stages.jpg` | Story B riser + fallback | Presentation p.7 |
| `assets/img/problem-site.jpg` | 01 | Presentation p.2 |
| `assets/img/form-suite.jpg`, `built-scan.jpg`, `captured-twin.jpg` | 02 cards | Presentation p.8 / 10 / 12 |
| `assets/img/reframe-slide.jpg` | Reframe fallback | Presentation p.9 |
| `assets/img/reframe-before.jpg`, `reframe-after.jpg` | Reframe slider | AI-generated (Nano Banana 2.1), one room, matched geometry |
| `assets/img/gaussian.jpg` | 03 media | Presentation p.6 |
| `assets/img/gold-coast-night.jpg` | Market band | Presentation p.5 |
| `assets/img/liability.jpg` | Liability slices | Presentation p.11 |
| `assets/img/pilot-towers.jpg` | 07 background | Presentation p.23 |
| `assets/tex/front.jpg`, `side.jpg`, `podium.jpg` (+ `*-emit.jpg`) | 3D tower textures | AI-generated orthographic elevations; emissive maps derived from them |

For production, serve AVIF/WebP at 800/1200/1600px via `srcset`. Keep the hero `fetchpriority="high"` and lazy-load everything else.

## Files in this bundle
- `Towers Passport Landing.html`: full page, design reference that runs as-is.
- `Towers Passport System & Motion Spec.html`: palette and type sheet, motion spec, delivery notes F1–F12.
- `css/tp.css`: all styles and tokens.
- `js/tower.js`: shared seeded tower point model, colour ramp, camera.
- `js/hero.js`: 2D hero (Focus lens) with 15 pins.
- `js/hero-3d.js`: option C, three.js 3D tower.
- `js/story-b.js`: **locked** image-riser spatial story.
- `js/story.js`: superseded point morph (A). Reference only.
- `js/reframe.js`: before/after slider.
- `js/app.js`: rail, nav, sticky CTA, investment selector, layer reveal, liability sequence, timelines, tweaks (strip the tweaks).
- `docs/GHL_TOWERS_PASSPORT_SETUP.md`: calendar, form, consent, pipeline, workflows and embed steps.
- `docs/SESSION_HANDOFF.md`, `docs/PROJECT_MEMORY.md`: decisions and open items.

## Open items before go-live
- [ ] Paul: hero **B vs C**, focus lens on the 3D tower (yes/no), and approval of the pin labels and the defect headline.
- [ ] GHL embed code and direct booking link; then swap the form for the calendar and change "Thirty minutes" to "One hour".
- [ ] Privacy Policy page plus footer link; legal entity name in the consent text.
- [ ] Decision on the Reframe AI-staging disclosure note.
- [ ] Tracking and chat: still TENTATIVE (see `SESSION_HANDOFF.md` §5).
- [ ] Real-device test at 430×932: 60fps, no horizontal overflow, sticky bar never covering content.
- [ ] With JS off or reduced motion on: page complete. Link-preview og tags correct.
- [ ] Domain plus HTTPS on the Genspark Code deployment.
