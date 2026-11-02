# Asset provenance

## Generated photographic plates (Life Unfolds)

Original images created for this project with **Seedream 5 Pro** (via ElevenLabs Creative,
2026-11-02). They depict no real patient, doctor or clinic. Originals are in `assets-src/generated/`,
web versions are in `public/story/` (built by `npm run assets`).

| File | Used in | Prompt summary |
| --- | --- | --- |
| `ch01-mother-wide.png` | Chapter 01 and the share card | Pregnant Indian woman in three-quarter profile, hands on belly, sheer ivory chiffon, golden backlight, negative space left, 85 mm, Portra tones |
| `ch06-hands-wide.png` | Chapter 06 bridge, static story | Close-up of hands cradling a pregnant belly, ivory knit, warm backlight, face out of frame |
| `ch07-newborn-wide.png` | Chapter 07, static story | Indian mother looking down at a sleeping newborn held securely in both arms, morning light |

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

Pending (prepared and priced but not yet run, because the provider's free queue was busy; flow and
node IDs are in `assets-src/generated/4k-jobs.json`). Run every job with **one generation each**:
left unset, the service renders four copies of each upscale and charges for all four.

| Job | Method | Estimate |
| --- | --- | --- |
| Mother, hands, newborn plates to 4K | Topaz Image Upscale, High Fidelity V3, 2×, no creative face changes | $0.15 |
| Genuine clinic photographs 01–08 to 3840 px | Topaz High Fidelity V3, 2.4×, **face enhancement off** so real people are not altered | $0.39 |
| Portrait (9:16) plates for chapters 01 and 07 | FLUX 3, rendered natively at 4K | $0.93 |
| Illustrative ~20-week image, version 2 | FLUX 3, 1:1, native 4K, prompt corrected after the review | $0.47 |
| Hands plate, far-hand repair | Nano Banana Pro edit at 4K; only the far hand is composited onto the upscale | $0.23 a try |

Until then the site serves the 2K masters (and phones crop the wide plates around their focal point).

Accept a new render only after checking it at 100%: hands (five separate digits), faces, and no
doubled edges, specks or text. The 20-week illustration must also show one unbroken cord from the
navel to the placenta, nothing touching the head, and a placenta that forms part of the sac wall.
It then needs the clinic's medical sign-off.

**20-week illustration support.** The story can already show a 20-week illustration after the
7-week scene in chapter 06. When `ch06-fetus-20w.png` is present, `npm run assets` adds it to the
manifest and the chapter shows it in a soft circle with its own caption ("Fig. 6a … (illustration)").
Without the file nothing changes, so add it only after sign-off.

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
