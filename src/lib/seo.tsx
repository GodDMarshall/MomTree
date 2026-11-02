import { site } from "./site";

export function clinicJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${site.url}/#clinic`,
    name: site.name,
    alternateName: "Momtree IVF",
    url: site.url,
    image: `${site.url}/og.jpg`,
    logo: `${site.url}/brand/logo.png`,
    telephone: site.phone.href.replace("tel:", ""),
    email: site.email,
    medicalSpecialty: ["Gynecologic", "Obstetric", "Urologic"],
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.address.building}, ${site.address.street}`,
      addressLocality: `${site.address.locality}, ${site.address.city}`,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    sameAs: [site.instagram],
  };
}

export function physicianJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: "Dr. Navyashri M S",
    jobTitle: "Medical Director and Chief Fertility Specialist",
    url: `${site.url}/doctors/dr-navyashri-m-s`,
    image: `${site.url}/legacy/2025/06/tyhtyh-02.png`,
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
