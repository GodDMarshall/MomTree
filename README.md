# Momtree IVF & Genetics: website

The new website for **Momtree IVF & Genetics**, Vijayanagar, Mysuru, in the clinic's own brand:
the official logo and its purple (#5C2499) and leaf green (#80C041). It opens with **Life Unfolds**,
a scroll-driven story that follows IVF step by step, entirely in real-time 3D, from the beginning of
hope to a newborn in her mother's arms, followed by an editorial site
covering 14 treatments, the Medical Director, facilities, patient reviews, a Knowledge Centre and a
conversational appointment request.

> **This is a review build.** Medical content, credentials, claims and testimonials are marked
> *pending* until the clinic approves them, and search engines are blocked. See
> [`docs/APPROVAL-CHECKLIST.md`](docs/APPROVAL-CHECKLIST.md) (also at `/review` on the running site).

---

## Run it (Windows, PowerShell)

Requires Node.js 20.9 or newer (built with Node 24).

```powershell
npm install
npm run dev          # http://localhost:3000
```

Production build:

```powershell
npm run build
npm run start        # http://localhost:3000
```

Checks (run against a production server on port 3100: `npx next start -p 3100`):

```powershell
npm run check                           # every page × phone / tablet / desktop, links, reduced motion
node scripts/perf-check.mjs             # LCP and transfer sizes
npm run posters                         # re-render the static story posters
npm run assets                          # rebuild plates, logo files, favicons and the share card
```

The checks use the locally installed Microsoft Edge or Chrome through `playwright-core`; nothing extra is downloaded.

## Configuration

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL, sitemap, structured data |
| `NEXT_PUBLIC_REVIEW_MODE` | `true` (default) shows pending markers and blocks indexing. Set `false` **only** after sign-off |
| `APPOINTMENT_WEBHOOK_URL` / `APPOINTMENT_WEBHOOK_SECRET` | Deliver appointment requests as signed JSON to a CRM, Apps Script, Zapier, etc. |
| `RESEND_API_KEY`, `APPOINTMENT_EMAIL_TO`, `APPOINTMENT_EMAIL_FROM` | Or deliver them by email via Resend |

With no delivery configured, the form does **not** pretend to succeed: it tells the visitor that
online requests aren't connected yet and offers phone and WhatsApp.

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
    site/ ui/ forms/       navigation, footer, hero, map, form, reveal system, rings…
  content/                 treatments, doctor, clinic (facilities, photos, reviews, FAQs), articles
  lib/life/                the WebGL engine, scenes, shaders, story timeline and audio
public/
  legacy/                  every image from the old site, with manifest.json (classification, usage)
  story/                   generated photographs (WebP stills) and rendered story frames
  brand/, media/           the official logo (full colour and white); the Medical Director's video
assets-src/generated/      full-resolution originals of the generated plates
scripts/                   asset pipeline, poster capture, site and performance checks
docs/                      audit, approval checklist, asset provenance, design direction
```

### Life Unfolds

`src/lib/life/story.ts` is the single timeline (0–100 "units") shared by the WebGL scenes and the
HTML captions, so words and images cannot drift apart. Each chapter is a scene module in
`src/lib/life/scenes/`:

Scenes have their own timelines, and the schedule in `story.ts` maps stretches of the story onto
them, so a scene can be reused or re-timed without rewriting its animation.

| Chapter | Scene | What is real-time 3D |
| --- | --- | --- |
| 01 The beginning | `sculpture.ts` | A faceless porcelain mother, raymarched from signed distance fields in a fullscreen shader (writes depth, so motes and leaves sit in front of or behind her) |
| 02 Understanding fertility | `anatomy.ts` | Uterus (lathed from a measured profile), cavity, tubes with fimbriae, ovaries and their resting (antral) follicles |
| 03 Ovarian stimulation | `anatomy.ts` | Several follicles growing in both ovaries; a monitoring scan in which follicles show dark; the trigger |
| 04 Egg collection | `anatomy.ts` | An ultrasound-guided needle through the vaginal wall draining follicles (schematic) |
| 05 Fertilisation | `specimen.ts` | Oocyte, zona, corona cells, instanced sperm at true scale; ICSI with holding pipette, needle and membrane dimple |
| 06 Embryo development | `specimen.ts` | Pronuclei → 2 → 4 → 8 cells → compacting morula → blastocyst (trophectoderm, inner cell mass, cavity) |
| 07 Embryo transfer | `transfer.ts` | Sagittal cutaway, transcervical catheter path, ultrasound sector re-shading tissue by echogenicity |
| 08 Implantation and the pregnancy test | `specimen.ts` | The blastocyst hatching from its zona and settling into the lining of the uterus |
| 09 The early scan | `pregnancy.ts` | Gestational sac, yolk sac and a ~1 cm embryo with a heart at about 135 beats a minute |
| 10 Pregnancy | `sculpture.ts` | The bump and uterus growing by week, the baby (true size for 12, 20, 28, 36 weeks) seen through a glass window, turning head-down, one continuous cord to the placenta |
| 11 The moment that matters | `sculpture.ts` | A soft light for the birth, the newborn in her arms, the leaves of the Momtree logo gathering above |

Labels and the true-to-scale bar are projected from the 3D camera into HTML every frame.
Adaptive quality: GPU tier detection, a frame-time governor that adjusts resolution, rendering
paused off screen. The hero shows a pre-rendered frame of the sculpture until WebGL is ready.
**Reduced motion, Save-Data or no WebGL2** get a static editorial version of the same story, with
rendered 4K frames of the science chapters (`public/story/posters`, `npm run posters`) and the three
generated photographs, each marked as AI-generated.

### Accessibility & privacy

Semantic landmarks and headings, a skip link, visible focus, keyboard-operable menus, dialogs and
accordions, AA colour contrast (green text on white uses a darker `leaf-ink`), labelled form fields, a text
transcript of the story for screen readers, sound off by default with a calm mode. No analytics
or tracking. Google Maps loads only on request. Patient details never appear in URLs or logs.

## Before launch

1. Work through `docs/APPROVAL-CHECKLIST.md` with the clinic.
2. Configure appointment delivery (see above) and test it end to end.
3. Set `NEXT_PUBLIC_REVIEW_MODE=false` and `NEXT_PUBLIC_SITE_URL`, rebuild, deploy.
4. Point the domain. Old WordPress URLs already redirect to the new pages (`next.config.ts`).
