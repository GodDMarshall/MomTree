# Asset provenance

What every image, sound and typeface in this template is, where it came from and where it is used.
The template contains no photographs of a real clinic, doctor or patient, and no third-party
artwork, models or recordings. A clinic adopting it adds its own photographs (see
[`LAUNCH-CHECKLIST.md`](LAUNCH-CHECKLIST.md)).

## Brand: the mark, favicons and share card

The logo is a neutral ring mark, original to this template, drawn as inline SVG in
`src/components/site/BrandMark.tsx`; the name and descriptor beside it come from `src/lib/site.ts`.
`npm run assets` (`scripts/prepare-assets.mjs`) draws the same geometry, without text, into
`public/brand/mark.png` (used in structured data) and the favicons (`src/app/icon.png`,
`src/app/apple-icon.png`). The default colours are the design tokens in `src/app/globals.css`
(purple #4A2D91 and gold #D9B36C). A clinic's own logo replaces all of these.

The social share card, `public/og.jpg` (1200×630), is rendered by `npm run posters`
(`scripts/capture-posters.mjs`) in the site's own typefaces: the mark, the clinic's name and the
care line, all read from the running site, over the AI-generated opening photograph and labelled
"AI-generated image, not a patient".

## The live story: all 3D

Life Unfolds follows IVF in order, in eleven chapters, and every frame is rendered live in the
browser with Three.js from code: no photographs, no third-party models. The mother and baby are a
stylised porcelain figure (`src/lib/life/scenes/sculpture.ts`), raymarched from signed distance
fields: faceless and draped, a likeness of no one. Her pregnancy grows by week with typical sizes
(crown-rump length by week, the uterus rising from the pelvis to below the ribs, the baby turning
head-down in the third trimester), seen through a glass window in the belly, and the story closes
with the newborn in her arms in a soft light, while points of light gather around them. Every
scene is labelled as an illustration, not to scale and not an individual outcome.

## Rendered by the engine: posters and plates

`npm run posters` (`scripts/capture-posters.mjs`) renders still images from the site's own 3D
engine, against a running production build (`npx next start -p 3100`):

| Folder | What | Size | Used in |
| --- | --- | --- | --- |
| `public/story/posters` | The opening frame (`hero`, and `hero-tall` for phones) and one frame for each of chapters 2–9 | 3840×2160 (`hero-tall` 1560×3376) | The hero until WebGL is ready; the static version of the story |
| `public/plates` | 13 laboratory and scan plates: fertilisation, ICSI, cleavage, blastocyst and hatching in portrait (4:5), and eight landscape (16:10) views from the anatomy to the early scan | 2400×3000 and 3200×2000 | The laboratory reel on the home page, Facilities, Treatments |

They are captioned as 3D visualisations or schematics, never as photographs of a clinic or a
patient, and need the same medical review as the story itself. Render them again after any change
to the engine, and after a change of name or city (the share card).

## Generated photographs (stills)

Original images created for this project with **Seedream 5 Pro** (via ElevenLabs Creative,
2026-11-02). They depict no real patient, doctor or clinic, and each is captioned as AI-generated,
not a patient, wherever it appears. Originals are in `assets-src/generated/`, web versions in
`public/story/` (built by `npm run assets`, which also writes `src/lib/life/plates.json`).

| File | Used in | Prompt summary |
| --- | --- | --- |
| `ch01-mother-wide.png` | Static story chapter 1, share card | Pregnant Indian woman in three-quarter profile, hands on belly, sheer ivory chiffon, golden backlight, negative space left, 85 mm, Portra tones |
| `ch06-hands-wide.png` | Static story chapter 10, home page welcome, About | Close-up of hands cradling a pregnant belly, ivory knit, warm backlight, face out of frame |
| `ch07-newborn-wide.png` | Static story chapter 11 | Indian mother looking down at a sleeping newborn held securely in both arms, morning light |

The static version of the story is what visitors see with reduced motion, Save-Data or no WebGL2.

An independent image review (clinical, artefact and adversarial passes) found the three plates
clean apart from two spots:

- **Mother:** a pale thread-like mark on the back of the lower hand. It has been removed with
  `scripts/retouch/heal-ch01-hand.py` (OpenCV inpaint plus matched film grain). Run the same
  script at scale 2 on the 4K upscale, because the upscale starts from the original render.
- **Hands:** the far hand's fingers, along the left edge of the belly, blend into one shape. A 4K
  retouch of that hand is prepared (see below). Only the far hand is composited back onto the
  upscale (`scripts/retouch/composite-ch06-farhand.py`); the near hand, whose fingertips reach into
  that area, is cut out of the blend and keeps every one of its own pixels. If two tries fail, the
  plate stays as it is; removing the far hand (and describing one hand in the alt text) remains an
  option.

### Resolution (4K)

`npm run assets` builds each plate at 1K, 2K and 4K (long edge 1280, 2048, 3840 px) and writes
`src/lib/life/plates.json`; the site only offers sizes that really exist. A 4K master placed in
`assets-src/generated/4k/` (same file name) takes precedence over the 2K original. Images are
served responsively up to 3840 px wide, so 4K and high-density displays get full resolution while
phones download a smaller size. The static-story posters are rendered at 3840×2160.

Done (2026-11-02): the mother, hands and newborn plates are 4K masters (Topaz Image Upscale, High
Fidelity V3, 2×, no creative face changes). Each upscale was compared with its original: shrunk
back to the original's size it differs by 1–2.4 levels in 255 on average, and in no area by more
than plain resampling of the image would; faces and hands were also compared at 100%. Every Topaz
upscale came back with a 9 px dark band on each edge. `scripts/retouch/fix-upscale-border.mjs`
measures it and refills it from the original (no crop or rescale); run it on each new upscale
before anything else.

Still to run (flow and node IDs in `assets-src/generated/4k-jobs.json`): the provider's free plan hit
its daily image limit. Run every job with **one generation each**: left unset, the service renders
four copies of each upscale and charges for all four.

| Job | Method | Estimate |
| --- | --- | --- |
| Portrait (9:16) plates for chapters 01 and 11 (`ch01-mother-tall`, `ch07-newborn-tall`) | FLUX 3, rendered natively at 4K | $0.93 |
| Hands plate, far-hand repair | Nano Banana Pro edit at 4K; only the far hand is composited onto the upscale | $0.23 a try |
| Illustrative ~20-week image, version 2 (optional) | FLUX 3, 1:1, native 4K, prompt corrected after the review | $0.47 |

Until the portrait plates exist, phones crop the wide plates around their focal point.

Accept a new render only after checking it at 100%: hands (five separate digits), faces, and no
doubled edges, specks or text. The 20-week illustration must also show one unbroken cord from the
navel to the placenta, nothing touching the head, and a placenta that forms part of the sac wall.
It then needs the clinic's medical sign-off; until then it stays out of the repository
(`.review/`, which git ignores).

**20-week illustration.** Not needed by the story: the all-3D Life Unfolds shows the baby at about
12, 20, 28 and 36 weeks in the sculpture itself. The job is kept in case a clinic wants a still
image; if one is ever added (`ch06-fetus-20w.png`, after sign-off), `npm run assets` builds it and
the launch checklist lists it, but the story does not show it.

**Rejected:** the first 20-week illustration (`assets-src/generated/rejected/ch06-fetus-20w-v1.png`)
drew the umbilical cord as two separate pieces: a stalk from the placenta that ends on the top-front
of the head, and a loop from the navel that fades out in the fluid. Its placenta also floated
inside the sac on a stalk instead of forming part of the sac wall, and the build looked older than
20 weeks. It is kept for the record and is not used.

## 3D and illustrations

All 3D is procedural (built in code in `src/lib/life/scenes`), with no third-party models. The
treatment line plates (`src/components/plates`) are original SVG drawings. Proportions follow
standard anatomy and embryology references. Two choices are deliberate, because common stock
imagery gets them wrong: the embryo transfer follows the transcervical route (not a lateral
approach), and early pregnancy at about 7 weeks shows an embryo of about 1 cm, not a formed fetus.
**All medical visualisations require review by the clinic's medical team before launch.**

## The clinic's own photographs

None are included. A clinic adds its own in `src/content/clinic.ts` (`clinicPhotos`, and the
photographs of each facility) and its doctor's portrait in `src/content/doctor.ts`; galleries and
sections stay hidden while empty. Use camera originals, so photographs stay sharp on large and 4K
screens. Do not run photographs of real people through an AI upscaler: upscalers can subtly alter
a face. Publish photographs in which people can be identified only with their written consent.

## Sound

An original generative score synthesised in the browser (`src/lib/life/audio.ts`): no recordings,
no licensing. An optional baby-coo sample can be added at `/public/audio/coo.mp3` (set
`StoryAudio.cooUrl`); it must be properly licensed.

## Demo video

`docs/demo/` holds a walkthrough video recorded from the site itself by `scripts/record-demo.mjs`
(`npm run demo:video`): every frame is the site's own rendering, and the sound is the story's
generative score.

## Fonts and libraries

Cormorant Garamond and Manrope (Google Fonts, SIL Open Font License), self-hosted by `next/font`.
Next.js, React, Three.js, GSAP (free, standard licence), Lenis and Tailwind CSS: MIT or equivalent
open-source licences.
