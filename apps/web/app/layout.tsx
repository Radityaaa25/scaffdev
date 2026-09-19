import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_OG_DESCRIPTION,
  organizationJsonLd,
  websiteJsonLd,
  baseMetadata,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = baseMetadata({
  title: {
    default: `${SITE_NAME} — Starter Kit Next.js & Laravel Siap Jalan`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_OG_DESCRIPTION,
  keywords: [
    "scaffolding generator Indonesia",
    "starter kit Next.js",
    "template Laravel",
    "boilerplate Indonesia",
    "integrasi Midtrans",
    "integrasi Supabase",
    "payment gateway Indonesia",
    "npx scaffdev",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Starter Kit Next.js & Laravel Siap Jalan`,
    description: DEFAULT_OG_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — Starter Kit Next.js & Laravel Siap Jalan`,
    description: DEFAULT_OG_DESCRIPTION,
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <SiteNavbar />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
