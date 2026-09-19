import type { Metadata } from "next";

/** Canonical production URL — ganti di satu tempat bila domain berubah. */
export const SITE_URL = "https://scaffdev.vercel.app";
export const SITE_NAME = "Scaffdev";
export const SITE_TAGLINE =
  "Scaffolding generator: starter kit Next.js & Laravel siap jalan dengan kurasi integrasi lokal Indonesia.";

export const DEFAULT_OG_DESCRIPTION =
  "Generate project boilerplate dengan tampilan visual jadi dan kurasi integrasi untuk konteks Indonesia — Supabase, Midtrans, Xendit, RajaOngkir. Satu baris command: npx scaffdev@latest.";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function baseMetadata(overrides: Partial<Metadata> = {}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    ...overrides,
  };
}

/* ---------------- JSON-LD builders ---------------- */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_TAGLINE,
    logo: absoluteUrl("/logo-full.png"),
    sameAs: ["https://github.com/Radityaaa25/scaffdev"],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_TAGLINE,
    inLanguage: "id",
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(input: {
  headline: string;
  description: string;
  urlPath: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    inLanguage: "id",
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(input.urlPath),
    },
  };
}

export function softwareApplicationJsonLd(input: {
  name: string;
  description: string;
  urlPath: string;
  framework: string;
  image?: string | null;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.urlPath),
    applicationCategory: "DeveloperApplication",
    operatingSystem: input.framework,
    inLanguage: "id",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "IDR" },
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
  if (input.image) data.image = input.image;
  return data;
}

export function itemListJsonLd(
  name: string,
  description: string,
  urlPath: string,
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    description,
    url: absoluteUrl(urlPath),
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}
