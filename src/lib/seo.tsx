import { director } from "@/content/doctor";
import { site } from "./site";

/** An absolute URL for a path on this site; absolute URLs are returned unchanged. */
function absoluteUrl(src: string) {
  return /^https?:\/\//.test(src) ? src : `${site.url}${src.startsWith("/") ? "" : "/"}${src}`;
}

export function clinicJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${site.url}/#clinic`,
    // The share-card script (scripts/capture-posters.mjs) reads name and alternateName from here.
    name: site.name,
    alternateName: site.shortName,
    url: site.url,
    image: `${site.url}/og.jpg`,
    logo: `${site.url}/brand/mark.png`,
    telephone: site.phone.href.replace("tel:", ""),
    email: site.email,
    medicalSpecialty: ["Gynecologic", "Obstetric", "Urologic"],
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.address.building}, ${site.address.street}`,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    ...(site.instagram ? { sameAs: [site.instagram.url] } : {}),
  };
}

export function physicianJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: director.name,
    jobTitle: director.role,
    url: `${site.url}/doctors/${director.slug}`,
    ...(director.portrait ? { image: absoluteUrl(director.portrait.src) } : {}),
    worksFor: { "@id": `${site.url}/#clinic` },
    medicalSpecialty: ["Gynecologic", "Obstetric"],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path}`,
    })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
