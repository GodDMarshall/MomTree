# Asset provenance

## Brand

The official logo comes from the clinic's own site (`public/legacy/2024/08/logo-1-01.png`, and the
tree mark `BACKDROP-04-1.png`). `npm run assets` trims their transparent margins and writes
`public/brand/logo.png` and `mark.png` unchanged, plus white versions of the same artwork for dark
sections (as the official site uses on its hero). The favicon and app icon are the full-colour tree
mark on white. Colours are taken from the logo: brand purple #5C2499 and leaf green #80C041.

## The live story: all 3D

Life Unfolds follows IVF in order, in eleven chapters, and every frame is rendered live in the
browser with Three.js from code: no photographs, no third-party models. The mother and baby are a
stylised porcelain figure (`src/lib/life/scenes/sculpture.ts`), raymarched from signed distance
fields: faceless and draped, a likeness of no one. Her pregnancy grows by week with typical sizes
(crown-rump length by week, the uterus rising from the pelvis to below the ribs, the baby turning
head-down in the third trimester), seen through a glass window in the belly, and the story closes
with the newborn in her arms under the leaves of the Momtree logo. Every scene is labelled as an
illustration, not to scale and not an individual outcome.

## Generated photographs (stills)

Original images created for this project with **Seedream 5 Pro** (via ElevenLabs Creative,
2026-11-02). They depict no real patient, doctor or clinic, and are now used only in the
reduced-motion version of the story and the share card, each marked "AI-generated image, not a
patient". Originals are in `assets-src/generated/`, web versions in `public/story/` (built by
`npm run assets`).

| File | Used in | Prompt summary |
| --- | --- | --- |
| `ch01-mother-wide.png` | Reduced-motion chapter 1, share card | Pregnant Indian woman in three-quarter profile, hands on belly, sheer ivory chiffon, golden backlight, negative space left, 85 mm, Portra tones |
| `ch06-hands-wide.png` | Reduced-motion chapter 10 | Close-up of hands cradling a pregnant belly, ivory knit, warm backlight, face out of frame |
| `ch07-newborn-wide.png` | Reduced-motion chapter 11 | Indian mother looking down at a sleeping newborn held securely in both arms, morning light |

An independent image review (clinical, artefact and adversarial passes) found the three plates
clean apart from two spots:

- **Mother:** a pale thread-like mark on the back of the lower hand. It has been removed with
  `scripts/retouch/heal-ch01-hand.py` (OpenCV inpaint plus matched film grain). Run the same
  script at scale 2 on the 4K upscale, because the upscale starts from the original render.
- **Hands:** the far hand's fingers, along the left edge of the belly, blend into one shape. A 4K
  retouch of that hand is prepared (see below). Only the far hand is composited back onto the
  upscale, so the near hand is never touched. If two tries fail, remove the far hand instead and
  change the plate's alt text to describe a single hand.

### Resolution (4K)

`npm run assets` builds each plate at 1K, 2K and 4K (long edge 1280, 2048, 3840 px) and writes
`src/lib/life/plates.json`; the site only offers sizes that really exist. A 4K master placed in
`assets-src/generated/4k/` (same file name) takes precedence over the 2K original. The story engine
picks the smallest variant that is sharp for the screen, and HTML images are served up to 3840 px
wide, so 4K and high-density displays get full resolution. The static-story posters are rendered
at 3840×2160.

Done (2026-11-02): the mother, hands and newborn plates are 4K masters (Topaz Image Upscale, High
Fidelity V3, 2×, no creative face changes), and clinic photograph 01 is served at 3840×2160
(`public/clinic/01.jpg`; Topaz, 2.4×, **face enhancement off** so the real person is not altered).
Each upscale was checked against its original: shrunk back to the original's size it differs by 1–2.4
levels in 255 on average and by at most 4.4 in any 32 px block, so nothing was invented; faces and
hands were also checked at 100%. Every Topaz upscale came back with a 9 px dark band on each edge.
`scripts/retouch/fix-upscale-border.mjs` refills it from the original (no crop or rescale); run it on
each new upscale before anything else.

Still to run (flow and node IDs in `assets-src/generated/4k-jobs.json`): the provider's free plan hit
its daily image limit after the fourth job. Run every job with **one generation each**: left unset,
the service renders four copies of each upscale and charges for all four.

| Job | Method | Estimate |
| --- | --- | --- |
| Genuine clinic photographs 02–08 to 3840 px | Topaz High Fidelity V3, 2.4×, **face enhancement off** so real people are not altered | $0.34 |
| Portrait (9:16) plates for chapters 01 and 07 | FLUX 3, rendered natively at 4K | $0.93 |
| Hands plate, far-hand repair | Nano Banana Pro edit at 4K; only the far hand is composited onto the upscale | $0.23 a try |
| Illustrative ~20-week image, version 2 (optional) | FLUX 3, 1:1, native 4K, prompt corrected after the review | $0.47 |

Until then clinic photographs 02–08 are served at their original 1600×900, and phones crop the wide
plates around their focal point.

Accept a new render only after checking it at 100%: hands (five separate digits), faces, and no
doubled edges, specks or text. The 20-week illustration must also show one unbroken cord from the
navel to the placenta, nothing touching the head, and a placenta that forms part of the sac wall.
It then needs the clinic's medical sign-off.

**20-week illustration.** No longer needed by the story: the all-3D Life Unfolds shows the baby at
about 12, 20, 28 and 36 weeks in the sculpture itself. The job is kept in case the clinic wants a still
image; if one is ever added (`ch06-fetus-20w.png`, after sign-off), `npm run assets` builds it and the
review page lists it, but the story does not show it.

**Not upscaled on purpose:** Dr. Navyashri's portrait. AI upscalers can subtly alter a real person's
face, so the clinic should supply a high-resolution original instead. The clinic's photographs are
only available at 1600×900 on the old site (checked as both JPEG and WebP), so camera originals would
be better still than upscales.

**Rejected:** the first 20-week illustration (`assets-src/generated/rejected/ch06-fetus-20w-v1.png`)
drew the umbilical cord as two separate pieces: a stalk from the placenta that ends on the top-front
of the head, and a loop from the navel that fades out in the fluid. Its placenta also floated
inside the sac on a stalk instead of forming part of the sac wall, and the build looked older than
20 weeks. It is kept for the record and is not used.

## 3D and illustrations

All 3D is procedural (built in code in `src/lib/life/scenes`), with no third-party models. The
treatment line plates (`src/components/plates`) are original SVG drawings. Proportions follow
standard anatomy and embryology references. **All medical visualisations require review by
the clinic's medical team before launch.**

## Clinic media

From the clinic's own WordPress media library (`public/legacy`, see `manifest.json`). Only genuine
photographs represent the clinic. The Medical Director's video is in `public/media/`.

## Visual reference pack

`momtree_ivf_visual_reference_pack.zip` (supplied by the client) was used as mood reference only.
None of its images are used on the site. Two of its panels were medically inaccurate and were
not followed: a lateral transfer catheter, and a formed fetus labelled "6–8 weeks".

## Sound

An original generative score synthesised in the browser (`src/lib/life/audio.ts`): no recordings,
no licensing. An optional baby-coo sample can be added at `/public/audio/coo.mp3` (set
`StoryAudio.cooUrl`); it must be properly licensed.

## Fonts and libraries

Cormorant Garamond and Manrope (Google Fonts, SIL Open Font License), self-hosted by `next/font`.
Next.js, React, Three.js, GSAP (free, standard licence), Lenis and Tailwind CSS: MIT or equivalent
open-source licences.
