import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";


import GlowProvider from "@/components/GlowProvider";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

/* ── Viewport Configuration ── */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0b0f",
};

/* ── SEO & Open Graph Metadata ── */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Thanaphat Karajhak (MK) | Portfolio",
    template: "%s | Thanaphat Karajhak",
  },
  description: "ผลงานและบริการของ นายธนภัทร การะจักษ์ (เอ็มเค) นักเรียน นักพัฒนาเว็บไซต์ ที่ปรึกษาด้านคอมพิวเตอร์ และนักตัดต่อวิดีโอ",
  keywords: [
    "portfolio", "web developer", "3D portfolio", "react", "next.js",
    "three.js", "full-stack developer", "frontend", "creative developer",
    "UI/UX", "framer motion", "webgl",
  ],
  authors: [{ name: "Thanaphat Karajhak" }],
  creator: "Thanaphat Karajhak",
  openGraph: {
    title: "Thanaphat Karajhak (MK) | Portfolio",
    description: "Portfolio ของ นายธนภัทร การะจักษ์ (เอ็มเค)",
    url: siteUrl,
    siteName: "Thanaphat Karajhak Portfolio",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "3D Portfolio Preview" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thanaphat Karajhak (MK) | Portfolio",
    description: "Portfolio ของ นายธนภัทร การะจักษ์ (เอ็มเค)",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/* ── JSON-LD Structured Data ── */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Thanaphat Karajhak",
  url: siteUrl,
  alternateName: ["นายธนภัทร การะจักษ์", "เอ็มเค", "MK"],
  jobTitle: "Student and Web Developer",
  sameAs: [
    "https://github.com/ertyu007",
    "https://www.tiktok.com/@ertyu0075",
    "https://youtube.com/@amazingwuji",
  ],
  knowsAbout: ["Web Development", "React", "Next.js", "Three.js", "UI/UX Design"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <GlowProvider />
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

