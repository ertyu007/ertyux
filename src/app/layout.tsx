import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";


import GlowProvider from "@/components/GlowProvider";

/* ── Viewport Configuration ── */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0b0f",
};

/* ── SEO & Open Graph Metadata ── */
export const metadata: Metadata = {
  metadataBase: new URL("https://myportfolio.dev"),
  title: {
    default: "3D Portfolio | Senior Developer",
    template: "%s | Portfolio",
  },
  description: "Futuristic 3D animated portfolio showcasing immersive web projects and creative engineering.",
  keywords: [
    "portfolio", "web developer", "3D portfolio", "react", "next.js",
    "three.js", "full-stack developer", "frontend", "creative developer",
    "UI/UX", "framer motion", "webgl",
  ],
  authors: [{ name: "Portfolio Owner" }],
  creator: "Portfolio Owner",
  openGraph: {
    title: "3D Portfolio | Senior Developer",
    description: "Futuristic 3D animated portfolio showcasing immersive web projects and creative engineering.",
    url: "https://myportfolio.dev",
    siteName: "Portfolio",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "3D Portfolio Preview" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "3D Portfolio | Senior Developer",
    description: "Futuristic 3D animated portfolio showcasing immersive web projects.",
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
  name: "Portfolio Owner",
  url: "https://myportfolio.dev",
  jobTitle: "Senior Developer",
  sameAs: [],
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

