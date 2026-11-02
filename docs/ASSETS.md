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

Not yet generated (the provider's free queue was busy): portrait (9:16) versions of chapters 01 and
07, and an illustrative ~20-week fetal image. The site crops the wide plates around a focal point
on phones, so nothing is missing. Add the files named in `scripts/prepare-assets.mjs` to use them.

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
