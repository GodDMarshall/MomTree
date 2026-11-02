import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { REVIEW_MODE } from "@/lib/review";
import { clinicJsonLd, JsonLd } from "@/lib/seo";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { RevealObserver } from "@/components/site/RevealObserver";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Momtree IVF & Genetics · Fertility care in Mysuru",
    template: "%s · Momtree IVF, Mysuru",
  },
  description:
    "Momtree IVF & Genetics, Vijayanagar, Mysuru. Fertility evaluation, IUI, IVF, ICSI and blastocyst culture, with personalised care led by Dr. Navyashri M S.",
  applicationName: site.name,
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Momtree IVF & Genetics: every beautiful story begins with hope" }],
  },
  twitter: { card: "summary_large_image" },
  // A review build must never be indexed: content is awaiting clinical approval.
  robots: REVIEW_MODE ? { index: false, follow: false } : { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${manrope.variable}`} data-tone="light">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <FloatingActions />
        <SmoothScroll />
        <RevealObserver />
        <JsonLd data={clinicJsonLd()} />
      </body>
    </html>
  );
}
