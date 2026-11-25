# IVF clinic website: a template

A complete website for an IVF and fertility clinic, ready to be adapted to one. It opens with
**Life Unfolds**, a scroll-driven story that follows IVF step by step, entirely in real-time 3D,
from the beginning of hope to a newborn in her mother's arms, followed by an editorial site
covering 14 treatments, the Medical Director, facilities, patient stories, a Knowledge Centre and a
conversational appointment request. It is written in British English for clinics in India (the ART
and Surrogacy Acts, the DPDP Act and the National Medical Commission's advertising guidelines).

> **This is a demo build.** The clinic is a placeholder (its name, contact details and address are
> set in `src/lib/site.ts`), the Medical Director's profile and the testimonials are samples, and a
> notice in the footer says so. Review mode is on: medical content, credentials, claims and
> testimonials are marked *pending* until a clinic approves them, and search engines are kept out.
> See [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) (also at `/review` on the running site).

---

## What it is

- **Life Unfolds.** Eleven chapters, from the beginning of hope through stimulation, egg
  collection, fertilisation, embryo development, transfer and the early scan to pregnancy and
  birth, rendered live with Three.js and custom shaders. Every scene is labelled as an
  illustration, and a static version takes over with reduced motion, Save-Data or no WebGL2.
- **Editorial pages.** Home, about, 14 treatment pages, the doctor's profile, facilities, patient
  stories, a Knowledge Centre of 8 articles, contact, privacy policy and medical disclaimer, all
  statically generated, with structured data and a sitemap.
- **A conversational appointment request.** A form written as one sentence ("My name is…"), with a
  validated server route, a honeypot and a rate limit, delivering to a webhook or by email. With no
  delivery configured it says so honestly and offers phone and WhatsApp instead.
- **Review mode.** Everything a clinic must approve carries a dashed *pending* marker, a live launch
  checklist generated from the content is at `/review`, and the site stays out of search engines
  until review mode is switched off.

## Make it yours

Everything specific to a clinic lives in a handful of files, and the pages read it from there:

| File | What it holds |
| --- | --- |
| `src/lib/site.ts` | Name, short name, descriptor, tagline, city, phone numbers, WhatsApp, email, address, map, Instagram, reviews page, opening hours, and the `demo` switch |
| `src/components/site/BrandMark.tsx` | The logo (a neutral ring mark until the clinic's own artwork replaces it) |
| `src/content/doctor.ts` | The Medical Director (a sample profile; portrait and video optional) |
| `src/content/clinic.ts` | The clinic's photographs, facilities, testimonials (samples), rating and home page questions |
| `src/content/treatments.ts`, `src/content/articles.ts` | Medical copy: needs clinician review; remove what the clinic does not offer |
| `src/lib/life/story.ts` | The story's captions and timings, to match the clinic's own practice |
| `src/app/globals.css` | Colours and type (design tokens) |
| `.env.local` | Site address, review mode, appointment delivery (see [Configuration](#configuration)) |

Then rebuild the generated images:

```bash
npm run assets       # story photographs at 1K / 2K / 4K, the brand mark and the favicons
npm run posters      # story posters, laboratory plates and the share card, from a running production build (see Checks)
```

Delete `.next/cache/images` before the next build: images in `/story` and `/plates` are served as
immutable, so the image optimiser would otherwise keep serving the old versions.

Optional details stay hidden until they are set: an alternate phone number, Instagram, a reviews
page, opening hours, the map, the doctor's video, a rating and the clinic's photographs. Until a
portrait is added, the doctor is shown with a neutral illustrated placeholder.
[`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) lists everything to replace or confirm, file
by file.

## Run it

Requires Node.js 20.11 or newer.

**Windows (PowerShell)**

```powershell
npm install
Copy-Item .env.example .env.local    # optional for local development
npm run dev                          # http://localhost:3000
```

Production build:

```powershell
npm run build
npm run start                        # http://localhost:3000
```

**macOS / Linux**

```bash
npm install
cp .env.example .env.local           # optional for local development
npm run dev                          # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start                        # http://localhost:3000
```

## Checks

The checks and the image capture run against a production server on port 3100. Start it in one
terminal and leave it running:

```bash
npm run build
npx next start -p 3100
```

Then, in a second terminal:

```bash
npm run check                    # every page × phone / tablet / desktop, links, reduced motion, the story on short and sideways screens
node scripts/perf-check.mjs      # LCP and transfer sizes
npm run typecheck
npm run posters                  # re-render the story posters, the laboratory plates and the share card
```

`npm run check` takes an optional address and screenshot folder:
`node scripts/site-check.mjs http://localhost:3100 .review/shots`.

The checks, the posters and the demo video drive a locally installed browser through
`playwright-core`; nothing extra is downloaded. They use the browser in `CHROME_PATH` when it is
set (any Chromium-based browser), otherwise Microsoft Edge, then Google Chrome. Set it when the
browser is not installed in its usual place:

```powershell
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"   # macOS
export CHROME_PATH=/usr/bin/chromium                                                # Linux
```

## Configuration

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL, sitemap, structured data, and the source named on appointment requests |
| `NEXT_PUBLIC_REVIEW_MODE` | `true` (default) shows pending markers and the `/review` checklist, and blocks indexing. Set `false` **only** after sign-off |
| `APPOINTMENT_WEBHOOK_URL` / `APPOINTMENT_WEBHOOK_SECRET` | Deliver appointment requests as JSON to a CRM, Google Apps Script, Zapier, etc. With a secret, each request is signed (HMAC-SHA256 in the `x-appointment-signature` header) |
| `RESEND_API_KEY`, `APPOINTMENT_EMAIL_TO`, `APPOINTMENT_EMAIL_FROM` | Or deliver them by email via Resend |

With no delivery configured, the form does **not** pretend to succeed: it tells the visitor that
online requests aren't connected yet and offers phone and WhatsApp.

Two more are best set in the shell, for one command at a time:

| Variable | Purpose |
| --- | --- |
| `NEXT_DIST_DIR` | Build folder (default `.next`). Set it, for example to `.next-demo`, for both `next build` and `next start` to run a second build beside the main one without touching it |
| `CHROME_PATH` | The browser for the checks, posters and demo video (see [Checks](#checks)); the scripts read it from the shell only |

## How it is built

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), TypeScript, React 19. All pages are statically generated except `/api/appointment`. |
| Styling | Tailwind CSS 4 with brand tokens in `src/app/globals.css` (base and components in cascade layers) |
| 3D | Three.js with custom GLSL, procedural geometry (no model downloads), loaded after first paint |
| Motion | GSAP ScrollTrigger drives the story timeline and the laboratory reel; Lenis smooths scrolling |
| Audio | Web Audio API: an original generative score, synthesised in the browser |

```
src/
  app/                     routes (home, about, treatments/[slug], doctors/[slug], facilities,
                           patient-stories, knowledge-centre/[slug], contact, privacy,
                           medical-disclaimer, review, api/appointment, sitemap, robots)
  components/
    life/                  Life Unfolds UI (sticky stage, captions, HUD, sound, static fallback)
    home/                  home sections (welcome, principles, director, index, lab, voices…)
    plates/                bespoke fine-line plates for each treatment
    site/ ui/ forms/       logo, navigation, footer, hero, map, portrait, form, reveal system, rings…
  content/                 treatments, doctor, clinic (facilities, plates, photographs, testimonials, FAQs), articles
  lib/                     site.ts (identity and contact), review mode, appointment validation, SEO
  lib/life/                the WebGL engine, scenes, shaders, story timeline and audio
public/
  story/                   generated photographs (WebP stills) and rendered story frames (posters/)
  plates/                  laboratory and scan plates rendered by the 3D engine
  brand/, og.jpg           the mark used in structured data; the social share card
assets-src/generated/      full-resolution originals of the generated photographs
scripts/                   asset pipeline, poster and plate capture, site and performance checks, demo video, retouching
docs/                      launch checklist, asset provenance, demo video
```

### Life Unfolds

`src/lib/life/story.ts` is the single timeline (0–100 "units") shared by the WebGL scenes and the
HTML captions, so words and images cannot drift apart. Each chapter is a scene module in
`src/lib/life/scenes/`:

Scenes have their own timelines, and the schedule in `story.ts` maps stretches of the story onto
them, so a scene can be reused or re-timed without rewriting its animation.

| Chapter | Scene | What is real-time 3D |
| --- | --- | --- |
| 01 The beginning | `sculpture.ts` | A faceless porcelain mother, raymarched from signed distance fields in a fullscreen shader (writes depth, so motes and points of light sit in front of or behind her) |
| 02 Understanding fertility | `anatomy.ts` | Uterus (lathed from a measured profile), cavity, tubes with fimbriae, ovaries and their resting (antral) follicles |
| 03 Ovarian stimulation | `anatomy.ts` | Several follicles growing in both ovaries; a monitoring scan in which follicles show dark; the trigger |
| 04 Egg collection | `anatomy.ts` | An ultrasound-guided needle through the vaginal wall draining follicles (schematic) |
| 05 Fertilisation | `specimen.ts` | Oocyte, zona, corona cells, instanced sperm at true scale; ICSI with holding pipette, needle and membrane dimple |
| 06 Embryo development | `specimen.ts` | Pronuclei → 2 → 4 → 8 cells → compacting morula → blastocyst (trophectoderm, inner cell mass, cavity) |
| 07 Embryo transfer | `transfer.ts` | Sagittal cutaway, transcervical catheter path, ultrasound sector re-shading tissue by echogenicity |
| 08 Implantation and the pregnancy test | `specimen.ts` | The blastocyst hatching from its zona and settling into the lining of the uterus |
| 09 The early scan | `pregnancy.ts` | Gestational sac, yolk sac and a ~1 cm embryo with a heart at about 135 beats a minute |
| 10 Pregnancy | `sculpture.ts` | The bump and uterus growing by week, the baby (true size for 12, 20, 28, 36 weeks) seen through a glass window, turning head-down, one continuous cord to the placenta |
| 11 Every hope matters | `sculpture.ts` | Mother and newborn in a soft light: the birth, the newborn in her arms, points of light gathering around them |

Labels and the true-to-scale bar are projected from the 3D camera into HTML every frame.
Adaptive quality: GPU tier detection, a frame-time governor that adjusts resolution, rendering
paused off screen. The hero shows a pre-rendered frame of the sculpture until WebGL is ready.
**Reduced motion, Save-Data or no WebGL2** get a static editorial version of the same story, with
rendered 4K frames of the science chapters (`public/story/posters`, `npm run posters`) and the three
generated photographs, each marked as AI-generated.

### Accessibility & privacy

Semantic landmarks and headings, a skip link, visible focus, keyboard-operable menus, dialogs and
accordions, AA colour contrast (gold text on white uses a darker `accent-ink`), labelled form fields, a text
transcript of the story for screen readers, sound off by default with a calm mode. No analytics
or tracking. Google Maps (once a location is set) loads only on request. Patient details never
appear in URLs or logs.

## Demo video

[`docs/demo/website-demo.mp4`](docs/demo/website-demo.mp4) walks through the whole site in about four minutes
(1920×1080, with the story's own generative score): the Life Unfolds story, the home page, treatments, the doctor's
profile, facilities, patient stories, the knowledge centre, an appointment request from start to confirmation, the
launch checklist, and the site on a phone.

It is produced by `scripts/record-demo.mjs` from a production build:

```bash
npm run build
npm run demo:video
```

The script starts the site itself (appointment requests go to a local receiver, so the form can show its
confirmation; nothing is sent anywhere), records each part, records the score, and joins them with
[ffmpeg](https://ffmpeg.org/), which must be installed. Frames are rendered on request rather than recorded live: the
page's clock is virtual, CSS animations are stepped one frame at a time, and the 3D story is drawn once per frame.
The result is smooth on any machine. Without a GPU, WebGL runs in software and a full recording takes about an hour;
`--preview 10` makes a quick draft. Other options: `--parts intro,story,site,mobile,outro`, `--no-audio`,
`--out <file>`, `--work <folder>`, `--jobs <n>` (see the top of the script).

The clinic's name on the title cards and on every page comes from `src/lib/site.ts`, so a renamed clinic gets a
matching video by running the script again.

## Before launch

1. Work through [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) with the clinic (a live
   version is at `/review` while review mode is on).
2. Configure appointment delivery (see [Configuration](#configuration)) and test it end to end.
3. Set `demo: false` in `src/lib/site.ts`, and `NEXT_PUBLIC_REVIEW_MODE=false` and
   `NEXT_PUBLIC_SITE_URL` in the environment; rebuild, run the checks, deploy.
4. Point the domain. If the clinic had an earlier website, add redirects from its old addresses in
   `next.config.ts` so existing links and search rankings keep working.
