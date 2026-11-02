# Audit of the existing momtreeivf.com (November 2026)

Pages reviewed: Home, About us, Treatment and care, Contact us, Blogs (and all 5 articles), plus the
unlinked `best-ivf-center-in-mysore` landing page, `thank-you` and `template`. The WordPress media
library (113 items) was retrieved through its public REST API.

## Authentic information carried over

| Item | Source | Where now |
| --- | --- | --- |
| Name: Momtree IVF & Genetics (logo wordmark "momtree IVF and Genetics") | Logo | Everywhere |
| Phone +91 9611454999, alternate 0821 4530704 | Contact | Header, footer, contact |
| Email momtreeivf@gmail.com | Contact | Footer, contact |
| Address: Sankalp Solitaire, 5671/B, General Thimmaiah Rd, Vijay Nagar 2nd Stage, Vijayanagar, Mysuru 570017 | Contact | Footer, contact, map |
| Instagram @momtreeivf | Home | Footer |
| WhatsApp booking (wa.link/b4gvt5) | Home | Replaced by a direct `wa.me/919611454999` link with a neutral message |
| Dr. Navyashri M S: Medical Director and Chief Fertility Specialist; MBBS, DGO, DNB, Reproductive Medicine (IIRH), Reproductive Medicine (NUH, Singapore), Fellowship in Regenerative Medicine in Infertility; 18+ years; training at RGUHS, JJM Medical College, Holdsworth Memorial Hospital, IIRH, CREST/NUH | About | Home, About, profile (marked for re-confirmation) |
| Treatments: fertility checkup, IUI, IVF, laser hatching, blastocyst culture, laparoscopy, hysteroscopy, ultrasound, andrology, ART bank, donor services, surrogacy; ovulation induction & cycle monitoring; ICSI | Treatment and care, Home | 14 treatment pages |
| Facilities: clinic & IVF centre, operation theatres & Class 10,000 clean room, experienced doctors, AI-enabled andrology lab, ultrasound & lab, in-house pharmacy | About | Facilities (claims marked) |
| "Why choose Momtree": comprehensive care, personalised plans, reproductive-medicine expertise, compassion | About | Home principles |
| Google reviews (via Trustindex): "Excellent, based on 170 reviews"; badge "Google Rating 4.8" | Home, media library | Verbatim quotes; figures marked to verify |
| 5 blog articles | Blogs | Migrated, corrected, expanded |

## Problems found, and how they were handled

| Problem | Handling |
| --- | --- |
| Statistics shown as **0+ / 0% / 0Yrs+** (happy couples, experience, success rate, staff) | Removed. No statistics are published unless verified. |
| Most home and about sections **duplicated** (every block appears twice) | Single, edited content. |
| "Mysore's **first AI powered/enabled** fertility center", "Mysore's **leading** fertility clinic", "**proven success rates**", "making your dream of parenthood a reality" | Not used: unverifiable or promissory. Listed for the clinic to evidence. |
| "AI enabled andrology lab" | Kept only as the clinic's own description, marked *pending* until the system is named. |
| ART bank described as supplying "**surrogate mothers**" | Removed: inconsistent with the Surrogacy (Regulation) Act, 2021. Rewritten within the ART and Surrogacy Acts. |
| Blog: "ICSI … for **higher success rates**" in couples over 35 | Corrected: ICSI helps with sperm or fertilisation problems and does not overcome age-related egg changes. |
| Blog: IVF babies have "**no increased risk** of abnormalities" | Corrected to a balanced statement on small increases in some risks, often linked to multiples or the underlying cause. |
| Blog: success rates in Mysore without figures or definitions | Rewritten as how to read success figures; no rates published. |
| Stock and AI images presented as clinic facilities (pharmacy, ultrasound machine product shots, families) | Archived in `public/legacy`; never captioned as Momtree's own. Genuine photos only for facilities. |
| Reception and consultation images (07, 08) look like design renders | Used with a *pending* note asking the clinic to confirm. |
| Inconsistent naming: "Mom Tree IVF", "MOM tree IVF", "Momtree IVF Center" | Standardised to **Momtree IVF & Genetics** / **Momtree IVF**. |
| Typos ("lIRH", "Mysore" vs "Mysuru", "faculties") | Corrected in site copy (reviews are quoted verbatim). |
| No opening hours, no ART registration number published | Placeholders shown only in review mode; on the checklist. |
| Cookie and consent banner text: "success rates vary … significant improvements" | Replaced with an honest medical disclaimer. |
| Old URLs | 301 redirects to the new pages (`next.config.ts`). |

## Media library

All 109 images and 4 videos were downloaded; one 14,583 px branding PNG is refused by the host
(HTTP 422), and its three sibling versions are included. See `public/legacy/manifest.json` for each
file's source URL, title, alt text, upload date, the live pages that used it, a classification and
whether the new site uses it.

| Classification | Count | Used |
| --- | --- | --- |
| Genuine clinic photographs | 6 | All |
| Clinic interiors, possibly renders | 2 | Yes, marked |
| Genuine staff portraits | 2 | The Medical Director's portrait |
| Event photographs (identifiable people) | 2 | Review build only, consent needed |
| Brand logos | 5 | Source for the tinted mark and favicons |
| Icons, graphics, layout pieces | 49 | No (replaced by the new design) |
| Stock / AI marketing images | 43 | No |
| Videos | 4 | The Medical Director's video (on her profile) |
