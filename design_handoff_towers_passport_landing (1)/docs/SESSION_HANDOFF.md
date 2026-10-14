# Session Handoff — Towers Passport Landing Page
Last updated: 13 Oct 2026 · Entity: ScanBuild1 · Status: DRAFT

---

## 1. Where we are

| Stage | Status | Owner |
|---|---|---|
| 1. Landing page design | **Complete (approved in principle)** | Design |
| 2. GoHighLevel calendar + CRM setup | **Next — not started** | Paul |
| 3. Embed calendar into page + final build pass | Waiting on Stage 2 | Design / build |
| 4. Deploy via Genspark Code + domain + go live | Waiting on Stage 3 | Build + Paul (DNS) |

**What not to do yet:** don't move into the full Genspark Code build. Don't touch the existing 30-min discovery-call calendar or the existing website. Don't add tracking or chat scripts until that decision is made.

---

## 2. Decisions made (DECISION — Paul, 13 Oct 2026)

1. **Design:** layout, spatial story, colourways and copy approved. Hero = Direction A · Displace, density 1.6.
2. **Liability section:** the new four-interval slice sequence is approved.
3. **Booking = Option A — embedded GHL calendar.**
   - A **new dedicated calendar** just for Towers Passport live demos.
   - Kept separate from the existing 30-min discovery call so leads aren't confused. It must not link back to the existing website.
   - The qualifying questions (company, tower class, project stage, site) **move into the GHL calendar's booking form**, asked after the person picks a time.
4. **Hosting = Option 2:** a standalone site deployed via Genspark (Genspark Code). GHL is used for the calendar, CRM and workflows.
5. **Tracking code / chat widget:** TENTATIVE. See §5.

---

## 3. Paul's checklist for the GHL session (Stage 2)

Do these in GoHighLevel, then bring back the items marked ➜.

**A. Create the calendar**
- [ ] New calendar, e.g. "Towers Passport — Live Demo". Event type: one-on-one, or round robin if Paul and James share it.
- [ ] Duration *(to decide: 30 or 45 min)*, buffers, availability, minimum notice, and how far ahead people can book.
- [ ] Meeting location: Google Meet or Zoom auto-link, and/or "On site — Gold Coast" as a choice.
- [ ] Confirmation and reminder messages (email + SMS) in Towers Passport wording.
- [ ] Calendar widget colours, so the embed sits as close to the brand as possible:
  - primary / button `#F2CB07` (Accent Yellow) with dark text, or `#004AAD` (Cobalt Blue)
  - text `#253238` (Azure Grey) on a light widget, or as close as the widget allows.

**B. Booking form (custom fields on the calendar form)**
- [ ] Name, email, mobile (standard fields).
- [ ] Company *(text)*.
- [ ] Tower class *(dropdown)*: Boutique · 3–13 storeys / Mid-rise · 13–33 storeys / High-rise · 33–100 storeys.
- [ ] Project stage *(dropdown)*: Pre-launch / design · In presales · Under construction · Near completion.
- [ ] Site or project name *(text, optional)*.
- [ ] **Additional attendees:** research whether GHL lets the booker invite guests (developer's stakeholders such as sales and marketing, architect, engineer, project manager). *Status: HYPOTHESIS — confirm in your GHL version.* If there's no native guest option, the fallback is a text area labelled "Who else should attend? (name, role, email)", with a workflow that adds them to the invite manually.

**C. CRM plumbing**
- [ ] Pipeline, e.g. "Towers Passport — Developers", with stages: Demo booked → Demo held → Launch-readiness review → Pilot agreement → Won / Lost.
- [ ] Workflow trigger "Appointment booked (this calendar)": create/update the contact, tag `towers-passport` and `tp-demo-booked`, create the opportunity, and notify Paul and James.
- [ ] Map tower class and stage into contact or opportunity custom fields for later segmentation.
- [ ] No-show / reschedule workflow.

**D. Bring back to the next session ➜**
- ➜ The **calendar embed code**: Calendars → this calendar → Share / Embed. This is usually an `<iframe>` plus a small `form_embed.js` script. *(Format to be confirmed against your account.)*
- ➜ The calendar's **direct booking link** as a fallback (for the SMS link after cold calls).
- ➜ A screenshot of the booking form fields.
- ➜ The domain or subdomain you'd like, e.g. `passport.scanbuild1.com.au` *(to decide)*, and who manages DNS.
- ➜ The decision (or questions) on tracking and chat — see §5.

---

## 4. What happens in Stage 3 (design/build, once the embed arrives)

1. Section 09 "Let's walk through your tower — before it exists": replace the design-only form with the GHL calendar embed in the same branded frame. Keep the three numbered steps on the left.
2. Every "Book a live demo" / "Book the demo" button (nav, hero, sticky mobile bar) scrolls to the calendar.
3. Loading state and fallback: a branded placeholder while the iframe loads, plus a "Open the booking page" link if the embed fails or JS is off. This keeps the brief's "page renders complete without JS" rule.
4. Mobile: check the iframe height and scrolling at 430px, that the sticky bar hides while the calendar is on screen, and that inputs don't zoom.
5. Optional: pass `?tower_class=` from the investment selector into the calendar URL if GHL supports pre-filling. *(HYPOTHESIS — verify.)*
6. Re-run the brief's checklist (§10), then hand off to Genspark Code.

---

## 5. Open question: tracking code and chat widget (TENTATIVE)

Options to weigh next session. Each is roughly one script tag, so the technical complexity is low. The real cost is in governance and noise.

| Item | What it gives | Effort | Risks / cons |
|---|---|---|---|
| **GHL external tracking script** | Page visits tied to contacts in GHL; attribution of the demo booking to source/UTM | Low: one script in `<head>` | Privacy notice needed; *availability in your plan to be confirmed* |
| **Google Analytics 4 / Tag Manager** | Traffic, scroll depth, CTA clicks, booking conversion | Low–medium (events take some setup) | Cookie / privacy wording; another dashboard to watch |
| **Meta / LinkedIn pixel** | Retargeting developers who visited | Low | Only worth it if paid ads are planned; privacy wording |
| **GHL chat widget** | Instant questions and capture before booking | Low to install, **ongoing** to staff | Clutters the mobile view next to the sticky CTA; unanswered chats hurt credibility; competes with the single "book a demo" action |

**Working view (AI INFERENCE, not decided):** add lightweight tracking (GHL script + GA4 events for CTA click and booking) at launch. **Hold the chat widget** unless someone can answer it during business hours. It conflicts with the page's one-action design and the sticky mobile bar.

Needed in any case: a short **Privacy Policy** page/link in the footer (Australian Privacy Principles), because the page collects personal information through the calendar.

---

## 6. Known items to check before go-live
- Mobile layout at 430px hasn't been checked in a real browser in this environment (it has only been checked in code). Check it on a real phone.
- Delivery notes F1–F12 (in `Towers Passport System & Motion Spec.html`) are still awaiting brand review. Key items: the #011A40 page background, the Chakra Petch / IBM Plex fonts, the six FAQ answers, and the "Acent" spelling.
- Real Horizons wording stays "delivered in partnership with…" until the agreement is signed.
- Logo: replace the cut-out PNG with the vector master when available.
