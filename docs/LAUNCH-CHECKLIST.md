# Launch checklist

Everything to replace or confirm before a clinic launches this site, and the file where each
change is made. The demo build ships with placeholders: a clinic called "Your Clinic", a sample
Medical Director, sample testimonials, contact details that cannot be used, and no photographs of a
real clinic.

While review mode is on (`NEXT_PUBLIC_REVIEW_MODE`, on by default), each item awaiting approval is
marked on the page itself with a dashed "pending" label, the site is kept out of search engines, and
a live version of this list, generated from the configuration and content, is at **`/review`**.

Work through it in order: replace the placeholders (sections 1–5), confirm the facilities and have
the medical content reviewed (6–9), then settle the legal and operational items and go live (10).
Mark each line approved, approved with changes (attach them), or removed. Content entries carry a `review` status: set it to `"approved"` once an item is
signed off.

## 1. Identity and contact: `src/lib/site.ts`

The single file for the clinic's identity. Page titles, the logo, the footer, structured data, the
share card and the WhatsApp message all read from it.

- [ ] `name` (the full name, used in titles, structured data and the footer), `shortName` (the name
      on its own, used in running text), `descriptor` (the line under the name in the logo) and
      `tagline`.
- [ ] `city`: named in page titles and the home page label ("Fertility care in …"). Leave it
      `null` to keep the site free of any location.
- [ ] `phone` (display text and `tel:` link), and `phoneAlt` for a second number (hidden while
      `null`).
- [ ] `whatsappNumber`, in international format without "+". The pre-filled message is generic on
      purpose: no personal data in URLs.
- [ ] `email`.
- [ ] `address` (building, street, locality, city, region, postal code, country): footer, contact
      page, privacy policy and structured data.
- [ ] `mapQuery`: the clinic's name and address as typed into Google Maps. The map and directions
      stay hidden while it is `null`; once set, check that both land at the clinic.
- [ ] `instagram` (`{ url, handle }`) and `reviewsUrl` (a public reviews page, for example a Google
      Business Profile). Each is hidden while `null`.
- [ ] `hours`: opening hours, added once the clinic confirms them (hidden while `null`).
- [ ] `nav`: menu labels and the Knowledge Centre categories, if the clinic's own differ.
- [ ] Website address: set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) for canonical addresses,
      the sitemap and structured data.

## 2. Logo, brand and claims

- [ ] **Logo** (`src/components/site/BrandMark.tsx`): replace the neutral ring mark (`Logo`,
      `LogoSwap`, `Mark`) with the clinic's own artwork, in full colour for light sections and in
      white for dark ones (the story, the footer, the mobile menu). Ask for vector artwork (SVG or
      PDF).
- [ ] **Favicons and the structured-data mark**: they are drawn by `scripts/prepare-assets.mjs`
      from the same geometry as the ring mark. Update the drawing there (or replace
      `src/app/icon.png`, `src/app/apple-icon.png` and `public/brand/mark.png` directly), then run
      `npm run assets`.
- [ ] **Share card** (`public/og.jpg`): its mark is drawn in `scripts/capture-posters.mjs`. Update
      it, then render the card again (section 10).
- [ ] **Colours and type**: the design tokens in `src/app/globals.css`. Keep AA contrast (gold
      text on white uses the darker `accent-ink`).
- [ ] **Claims**: no "first", "leading", "best" or "proven success" claims are made. Add one only
      with evidence.
- [ ] **Statistics**: none are shown. Add only verified figures, each with its definition (what
      was counted, and over which period).
- [ ] **Equipment described as automated or AI-assisted** (for example in the andrology
      laboratory): name the system and what it does, or leave the description out.

## 3. Medical Director and team: `src/content/doctor.ts`

The demo shows a sample profile ("Dr. Firstname Lastname"), marked as a sample in review mode.

- [ ] Replace every field with the clinic's own doctor, as approved: `slug` (the profile's address,
      `/doctors/<slug>`), `name`, `display` (the name as display type: the part in `*asterisks*` is
      set in italics), `role`, `credentials`, `qualifications`, `experience`, `summary`, `bio`,
      `training` and `expertise`.
- [ ] `portrait`: a square photograph (`{ src, width, height, alt }`, with the file in `public/`).
      While it is `null`, a neutral illustrated placeholder is shown. Use a camera original, with
      permission to publish; do not run a portrait through an AI upscaler, which can subtly alter a
      face.
- [ ] `video` (optional): a short introduction (`{ src, poster, title }`), with permission to
      publish and captions. The section is hidden while it is `null`.
- [ ] Other doctors and team members: add profiles only once every qualification has been verified.

## 4. Photographs and imagery: `src/content/clinic.ts`

The demo has no photographs of a real clinic. Rooms and procedures are shown with 3D
visualisations rendered by the site's own engine, and three AI-generated photographs appear, each
captioned as such (see [`ASSETS.md`](ASSETS.md)).

- [ ] `clinicPhotos`: photographs of the clinic's own premises, as camera originals so they stay
      sharp on large screens. The galleries on the home page and Facilities stay hidden while the
      list is empty. Confirm that no patient can be identified.
- [ ] `facilities`: a photograph for each room (`photos`). Where there is none, a dashed
      placeholder is shown.
- [ ] `events`: community or event photographs, only with written consent from everyone pictured
      (shown in the review build only).
- [ ] `plates`: the laboratory and scan visualisations, captioned as visualisations or schematics.
      Check each against the clinic's practice, or replace it with the clinic's own photograph.
- [ ] `stills`: the AI-generated mother, hands and newborn photographs (static story, share card,
      home page, About). Approve their use, or replace them with licensed photographs, keeping the
      captions honest.

## 5. Testimonials: `src/content/clinic.ts`

- [ ] `reviews`: the demo shows five sample testimonials (illustrative wording, not real patients),
      labelled as samples. Replace them with reviews the clinic has written permission to quote,
      each with its source, and set `sample` to `false`. An empty list hides the testimonial
      sections.
- [ ] **Medical advertising rules**: a legal review of testimonials, quoted reviews and patient
      stories against the National Medical Commission's current guidelines on advertising and
      public communication, which may not permit promotional patient stories or testimonials even
      with consent.
- [ ] `ratingSummary` (`{ rating, count, verified }`): a published rating, shown only when set. Use
      current, verified figures, or leave it `null`.

## 6. Facilities and registration

- [ ] `facilities` (`src/content/clinic.ts`): check that each room and service described exists at
      the clinic, and remove any that do not. Confirm the clean-room classification with
      documentation.
- [ ] **ART (Regulation) Act, 2021**: the clinic's registration number, for the footer
      (`src/components/site/Footer.tsx`).
- [ ] **Surrogacy (Regulation) Act, 2021**: the registration, if surrogacy services are offered;
      otherwise remove the surrogacy page.
- [ ] **ART bank**: confirm whether the clinic is a registered ART bank or works with one.
- [ ] Opening hours (`site.hours`, section 1).

## 7. Treatments: `src/content/treatments.ts`

Each page needs clinician review of what it is, who may be evaluated, the steps, what to expect,
risks and limitations, the FAQs and the "at a glance" facts. Remove any treatment the clinic does
not offer.

- [ ] Fertility evaluation
- [ ] Ovulation induction & cycle monitoring
- [ ] IUI
- [ ] IVF
- [ ] ICSI
- [ ] Blastocyst culture
- [ ] Laser-assisted hatching (confirm that laser equipment is in use)
- [ ] Laparoscopy
- [ ] Hysteroscopy
- [ ] Ultrasound
- [ ] Andrology (name the system before any automated or AI-assisted description)
- [ ] ART bank & cryopreservation (a registered ART bank, or works with one)
- [ ] Donor services (legal statements to be confirmed against the current ART rules)
- [ ] Surrogacy services (legal statements to be confirmed against the current Surrogacy rules)

## 8. Knowledge Centre and home page

Articles are in `src/content/articles.ts`, the home page questions in `src/content/clinic.ts`
(`homeFaqs`). Each needs clinician review.

- [ ] IVF after 35: what changes, and what can help
- [ ] IVF myths and facts
- [ ] How to choose a fertility clinic
- [ ] When to seek help, and when IVF may be considered
- [ ] IVF success rates and costs: what the numbers mean (no rates are published)
- [ ] Understanding a semen analysis (cites the WHO 2021 reference limits)
- [ ] IUI and ICSI: two very different treatments
- [ ] Preparing your body and mind for fertility treatment
- [ ] Home page questions (8 answers, including costs and privacy)

## 9. Life Unfolds: `src/lib/life/story.ts`

The home page story follows IVF in order, in eleven chapters, all in 3D: the beginning;
understanding fertility; ovarian stimulation; egg collection; fertilisation; embryo development;
embryo transfer; implantation and the pregnancy test; the early scan; pregnancy; every hope
matters. Captions, labels and timings are in `story.ts`.

- [ ] The opening: the camera moves in from the standing figure to her pelvis, her skin there
      turns to glass and the uterus, tubes and ovaries are shown in place inside her at true size
      (low in the pelvis, behind the pubic bone), before she dissolves into the anatomy chapter.
      Approve the placement, the scale and the way the transition is shown.
- [ ] Medical review of every visualisation: anatomy (front view) and resting (antral) follicles;
      stimulation with several follicles growing in both ovaries; the monitoring scan; the
      trigger; egg collection (schematic: a transvaginal needle under ultrasound draining
      follicles, fluid to the laboratory); fertilisation by IVF and ICSI; pronuclei; cleavage
      stages with day labels; morula; blastocyst; transcervical transfer under ultrasound; hatching
      and the start of implantation; early pregnancy at about 7 weeks (heart at about 135 beats a
      minute); the sculptural pregnancy at about 12, 20, 28 and 36 weeks (sizes by week, the baby
      turning head-down, one continuous cord to a placenta on the uterine wall); and the newborn in
      her arms.
- [ ] Timings in the captions against the clinic's own practice: length of stimulation,
      trigger-to-collection interval, day of transfer, day of the pregnancy test, timing of the
      early scan, progesterone support and embryo-number policy.
- [ ] Caption and chapter wording, including the statements that fertilisation, implantation and
      pregnancy are not guaranteed.
- [ ] The sculptural mother and baby: a stylised porcelain figure built in code, faceless and
      clothed, a likeness of no one.
- [ ] The three AI-generated photographs in the static version of the story (shown with reduced
      motion, Save-Data or no WebGL2), each marked "AI-generated image, not a patient".
- [ ] **20-week illustration (optional, still image only).** The live story shows the pregnancy in
      3D. A reviewed AI illustration can be added (see [`ASSETS.md`](ASSETS.md)); approve it before
      it is used, or leave it out.
- [ ] Sound: an original synthesised score. Optional: a licensed baby-coo recording.

## 10. Legal, operations and going live

- [ ] **Privacy policy** (`/privacy`, drafted for the Digital Personal Data Protection Act, 2023):
      legal review, and a named grievance contact.
- [ ] **Medical disclaimer** (`/medical-disclaimer`): approve the wording.
- [ ] **Vision and mission** on the About page: drafts provided; confirm or replace them.
- [ ] **Service commitments** on the About page (time to talk, written estimates, prompt results,
      emotional support): confirm that the clinic offers each.
- [ ] **Appointment delivery**: configure `APPOINTMENT_WEBHOOK_URL` or `RESEND_API_KEY` with
      `APPOINTMENT_EMAIL_TO` and `APPOINTMENT_EMAIL_FROM` (see `.env.example`), then send a test
      request end to end. Until then the form asks visitors to call or WhatsApp.
- [ ] **Analytics**: none are installed. If wanted, choose a privacy-respecting option and update
      the privacy policy.
- [ ] **Generated images**: run `npm run assets`, then build, start a production server
      (`npx next start -p 3100`) and run `npm run posters` to render the story posters, the
      laboratory plates and the share card (it carries the clinic's name and city). Before
      rebuilding, delete `.next/cache/images`: images in `/story` and `/plates` are served as
      immutable, so the image optimiser would otherwise keep the old versions for a year. Once the
      site is live, give a changed image a new file name, because browsers keep them for a year too.
- [ ] **Demo mode**: set `demo` to `false` in `src/lib/site.ts` once every placeholder above has
      been replaced. The footer's demo notice goes (while it is on, search engines are kept out
      too).
- [ ] **Review mode**: set `NEXT_PUBLIC_REVIEW_MODE=false` only once every item here has been
      signed off. The pending markers and `/review` disappear, and, with demo mode off, search
      engines may index the site.
- [ ] Rebuild, run the checks (`npm run check` against the production build), deploy and point the
      domain. If the clinic had an earlier website, add redirects from its old addresses in
      `next.config.ts`.

## Sign-off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Medical Director | | | |
| Clinic management | | | |
| Legal adviser | | | |
