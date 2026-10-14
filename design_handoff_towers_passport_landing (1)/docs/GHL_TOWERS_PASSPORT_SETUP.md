# GoHighLevel Setup: Towers Passport Live Demo
Entity: ScanBuild1 · Sub-account: ScanBuild 1 · Status: DRAFT (Stage 2, CRM setup) · 14 Oct 2026

Reference (SOURCE: previous GHL session, Sep 2026). The existing ScanBuild1 discovery-call setup uses:
- Workflows `SB1 – Booking → Opportunity` and `SB1 – Discovery Call Confirm + Reminders`. Between them these handle the internal email, the client confirmation, and the 24-hour and 1-hour reminders.
- Pipeline `SB1 Client Acquisition`.
- Native calendar notifications kept to **in-app only**, with workflows doing all email, so nothing doubles up.
- `{{user.email_signature}}` at the end of every email.

The Towers Passport setup below mirrors that structure but is kept fully separate.

---

## 0. One naming decision first
The landing page CTA everywhere says **"Book a live demo"**, but the calendar is named "Discovery Call". The page, the calendar, the invite and the emails should all use the same words.
- **Recommended:** rename the calendar to `ScanBuild1 – Towers Passport Live Demo`.
- If you keep "Discovery Call", I'll change the page CTAs to match.

---

## 1. Calendar · Basic details (paste-ready)

**Calendar name**
```
ScanBuild1 – Towers Passport Live Demo
```

**Description**. The current text is copied from the 30-min inspection call; it mentions QBCC inspection and a "free first-site demonstration", which doesn't fit Towers Passport. Replace it with:
```
Book a 60-minute Towers Passport live demo

A working session for multi-level residential developers. We'll walk you through the platform using a tower like yours: the interactive FORM sales suite, BUILT interval scans and design-vs-scan review, and the CAPTURED as-built digital twin.

• See the live platform, not a slide deck
• Talk through your project, drawings and launch timeline
• Find out if one of the two founding pilot places suits your tower

Online or on site · Gold Coast based
```

**Custom URL** (`/widget/bookings/…`):
```
towers-passport-live-demo
```
Alternative if you want the brand in it: `scanbuild1-towers-passport`. Keep it lowercase with hyphens and no random suffix. The current `scanbuild1-discovery-cally7xhxq` was created automatically when you duplicated the calendar.

**Meeting invite title**
```
{{contact.name}} – Towers Passport Live Demo · ScanBuild1
```

**Group:** leave blank.

---

> **Update 14 Oct (form object limit).** A GHL form can hold fields from **Contact plus ONE other object**, either Company or Opportunity, not both. Our form had Contact + Company (the standard "Company name" field), so the Opportunity fields were blocked.
> **Recommended fix:** recreate the TP fields as **Contact** custom fields (same names and options). Remove the standard Company-object field and use a Contact field "TP · Company" instead, or the contact's own Business Name field if it's offered under Contact. Workflow A then copies the values onto the opportunity.
> **Quick fix (alternative):** delete the Company-object field from the form, and the Opportunity fields will add. Then check the form's opportunity settings point at the Towers pipeline, stage 02, and that Workflow A *updates* the existing opportunity instead of creating a second one.

## 2. Custom fields (create these BEFORE the form)
Settings → Custom Fields → new folder **"Towers Passport"**. Create fields as **Opportunity** fields if your plan allows, otherwise as **Contact** fields.

| Field name | Type | Options |
|---|---|---|
| TP · Company | Single line | (or use the standard Company Name field) |
| TP · Role | Dropdown | Development Director · Managing Director / Owner · Development Manager · Sales & Marketing · Project Manager · Other |
| TP · Tower class | Dropdown | Boutique · 3–13 storeys / Mid-rise · 13–33 storeys / High-rise · 33–100 storeys |
| TP · Project stage | Dropdown | Pre-launch / design · In presales · Under construction · Near completion |
| TP · Site or project | Single line | — |
| TP · Additional attendees | Multi-line | Placeholder: "Name, role, email (one per line)" |
| TP · Source | Hidden / single line | Filled automatically from UTM, e.g. `cold-call`, `referral`, `sms-link` |

These dropdown options match the landing page selector **exactly**, so the reports line up with the site.

---

## 3. The booking form: "TP – Live Demo Booking Form"
Sites → Forms → Builder → **+ Add form** → blank. Name it `TP – Live Demo Booking Form`.

| # | Field | Required | Notes |
|---|---|---|---|
| 1 | First name | ✓ | standard |
| 2 | Last name | ✓ | standard |
| 3 | Email | ✓ | standard |
| 4 | Phone | ✓ | standard. Mobile is preferred for SMS links after calls |
| 5 | Company name | ✓ | standard Company field |
| 6 | TP · Role | ✓ | |
| 7 | TP · Tower class | ✓ | |
| 8 | TP · Project stage | ✓ | |
| 9 | TP · Site or project | — | "e.g. Broadbeach, 28 levels" |
| 10 | TP · Additional attendees | — | Label: "Who else should join? (sales, marketing, architect, engineer, PM)" |
| 11 | Consent / Terms | ✓ | "I agree to ScanBuild1 contacting me about this demo." Link it to the Privacy Policy (needed before go-live). |
| hidden | TP · Source | — | Query-key `utm_source` |

**Styling** (Form → Styles), to sit close to the page palette:
- Button: `#F2CB07` with text `#0B1A2E`.
- Labels: `#253238`.
- Field border: `#5B7B8A`.
- Font: closest available sans. IBM Plex Sans if offered, otherwise Inter or Roboto.
- Corners: 4px.

Then attach the form: Calendar → **Form & confirmation** → **Use custom form** → select `TP – Live Demo Booking Form`. Mark it as a template by naming it with the `TP –` prefix, so you can duplicate it for later Towers calendars.

**Additional attendees (VERIFY in your account):**
- Some GHL calendar versions have a native **"Allow guests / Add guests"** toggle under Form & confirmation (or Booking rules). If yours has it, turn it on: guests then receive the calendar invite automatically.
- If it doesn't, the attendees field in row 10 is the fallback. The internal email (section 6) prints those names, and you add them to the invite manually.

**Confirmation:** "Thank you" message, or redirect to a page.
- Recommended message: `You're booked. We'll send the meeting link and a short prep note shortly.`
- A redirect to a thank-you page is better for ad tracking later. Leave that until tracking is decided.

---

## 3b. Consent checkboxes (DRAFT, needs legal entity name and Privacy Policy URL)
1. **Required, unticked.** "I agree to ScanBuild1 contacting me by email, phone and SMS about this demo booking, including confirmations, reminders, meeting links and follow-up about my project. Reply STOP to opt out of SMS."
2. **Optional, unticked.** "Keep me updated on Towers Passport, including new features, case studies and founding pilot availability. You can unsubscribe at any time."
3. **Required, unticked.** "I have read the [Privacy Policy] and understand how ScanBuild1 collects and uses my information."
Collection note under the button: "Your details are used only to arrange and follow up your demo, and are never sold. ScanBuild1, Gold Coast QLD."

## 4. Notifications & policies (this calendar)
Same rule as the SB1 calendar: workflows send the emails, and the calendar only sends in-app alerts.

| Notification | Setting |
|---|---|
| Appointment booked (Unconfirmed) | In-app ON only |
| Appointment booked (Confirmed) | In-app ON only |
| Cancellation | Email + In-app ON (as in your screenshot), **only if** there's no cancel workflow. Otherwise in-app only |
| Reschedule | Same as cancellation |
| Reminder | OFF (the workflow handles it) |
| Follow-up | OFF |
| SMS / WhatsApp | OFF for now |

For the cancel and reschedule emails, reuse the four templates from the SB1 session. Change "discovery call" to "Towers Passport live demo" and keep `{{user.email_signature}}` at the end.

---

## 5. Separate pipeline: "SB1 · Towers Passport — Developers"
Opportunities → Pipelines → **+ Create pipeline**. Keep it fully separate from `SB1 Client Acquisition`.

| # | Stage | How a lead gets here |
|---|---|---|
| 01 | **New Lead — Manual Entry** | You add it by hand after a cold call, referral or event. Also the stage for SMS-link leads who haven't booked yet. |
| 02 | **Demo Booked** | **Automatic:** the booking workflow drops every new booking here. |
| 03 | **Demo Held — Qualified** | Automatic when the appointment is marked *Showed*, or set manually. |
| 04 | **Launch-Readiness Review** | Drawings, timeline and project reviewed (step 2 on the page). |
| 05 | **Proposal & Pilot Terms Sent** | Fee proposal and founding pilot terms issued. |
| 06 | **Negotiation / Board & Lender Review** | Developer's internal and finance approval. Usually the longest stage. |
| 07 | **Agreement Signed — Founding Pilot** | Set opportunity status to **Won**. |
| 08 | **Deposit Received — Onboarding** | Deposit paid. Hand over to delivery (FORM build kick-off). |
| 09 | **Nurture — Not Now** | Interested but the timing is wrong. Monthly nurture. |

- **Lost:** use GHL's **Lost** status with a reason (Price / Timing / Went elsewhere / No response) rather than a stage. This keeps the board clean and makes the reports accurate.
- **Pilot places:** add a tag `tp-founding-pilot` at stage 07. Only two places exist, so you can see straight away how many are taken.

**Opportunity value** (optional): use the program fee for the tower class from the page table. Boutique $0.59m · Mid-rise $2.15m · High-rise $5.11m. For founding partners, reduce the success fee to 0.25%. Mark these as ESTIMATED until the proposal is issued.

---

## 6. Workflows: duplicate and adapt
Automation → Workflows. **Duplicate** each SB1 workflow (don't edit the originals), rename it, then change only what's listed.

### A. `TP – Booking → Opportunity` (from `SB1 – Booking → Opportunity`)
| Element | Change to |
|---|---|
| Trigger | Customer Booked Appointment → filter **Calendar = ScanBuild1 – Towers Passport Live Demo**. Make sure the SB1 workflow is filtered to the old calendar only, so the two never both fire. |
| Create / Update Opportunity | Pipeline **SB1 · Towers Passport — Developers** → Stage **02 Demo Booked**. Opportunity name: `{{contact.company_name}} – {{TP · Site or project}}`. Source `Website – Towers Passport`. |
| Add tags | `towers-passport` · `tp-demo-booked` · plus a tag per tower class if you want segments, e.g. `tp-midrise` |
| Internal email | Subject: `New Towers Passport demo – {{contact.company_name}} – {{appointment.only_start_date}}`. Body lists role, tower class, project stage, site and **additional attendees**. |
| Assign user | You (or round-robin with James, if he's on the calendar) |

### B. `TP – Demo Confirm + Reminders` (from `SB1 – Discovery Call Confirm + Reminders`)
| Element | Change to |
|---|---|
| Trigger | Same calendar filter as A |
| Client confirmation | Subject: `Your Towers Passport live demo is booked`. Add one line: "If you'd like your sales, design or project team to join, reply with their names and emails." |
| 24-hour reminder | Keep the timing. Add a prep line: "If you have drawings or a site plan handy, bring them — we'll use them in the launch-readiness discussion." |
| 1-hour reminder | Keep. Meeting link `{{appointment.meeting_location}}` |
| Signature | `{{user.email_signature}}` on every email |

### C. New: `TP – Demo Held → Stage 03`
- Trigger: Appointment Status → **Showed**, with the calendar filter.
- Action: move the opportunity to **03 Demo Held — Qualified**.
- Action: create a task for you, due in 2 days: "Send launch-readiness review request + deck".

### D. New: `TP – No-show / Cancel recovery`
- Trigger: Appointment Status → **No-show** or **Cancelled**, with the calendar filter.
- Actions:
  - wait 2 hours, then send a short rebook email using `{{appointment.reschedule_link}}`
  - tag `tp-noshow`
  - leave the opportunity at stage 02 and create a call task

**Test before go-live:** book, cancel and reschedule once each with a test contact. Check that:
- the opportunity lands in stage 02 of the **Towers** pipeline (not SB1)
- the tags are applied
- the merge fields render
- the email signature shows
- no duplicate emails are sent

---

## 7. Embedding on the landing page (Stage 3, my side)
1. In the calendar, go to **Booking channels** (or the Share / `</>` icon). Choose **Embed code**, select the inline / iframe option, and copy it. It looks like: `<iframe src="https://api.leadconnectorhq.com/widget/booking/…" …></iframe><script src="https://link.msgsndr.com/js/form_embed.js"></script>`. The exact domains may differ in your account.
2. Also copy the **direct booking link**. You'll use it for SMS links after cold calls, and the page uses it as the fallback.
3. Paste both to me. I'll then:
   - replace the design-only form in section 09 ("Let's walk through your tower") with the calendar, inside the same branded panel
   - point every "Book a live demo" / "Book the demo" button at it
   - add a branded loading state, plus an "Open the booking page" fallback link for no-JS or a blocked iframe
   - pass `utm_source` through to the hidden Source field
   - test it at 430px on mobile, with the sticky bar hidden while the calendar is on screen
4. **Page copy fix pending:** the page says "Thirty minutes" above the form. That changes to **"One hour"** to match your booking rules. It'll be done when the embed goes in (or now, if you'd like).

---

## 8. Checklist: what to bring back
- [ ] Calendar name decision (Live Demo vs Discovery Call)
- [ ] Embed code + direct booking link
- [ ] Confirmation that the custom form is attached, plus a screenshot
- [ ] Whether the native "guests" option exists in your account
- [ ] Pipeline created (screenshot)
- [ ] Workflows A–D duplicated, filtered and tested
- [ ] Privacy Policy URL, for the consent checkbox and the page footer

**Not yet:** tracking scripts, chat widget, ad pixels (still TENTATIVE), and the full build in Genspark Code.
