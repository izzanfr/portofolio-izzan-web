import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider, themeInitScript } from "@/components/providers/ThemeProvider";
import { LocaleProvider, localeInitScript } from "@/components/providers/LocaleProvider";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import "lenis/dist/lenis.css";
import { Preloader, preloaderInitScript } from "@/components/Preloader";
import { ImageGuard } from "@/components/ImageGuard";
import { profile } from "@/lib/content";
import { motionInitScript } from "@/lib/motion";

// Display serif — SOFT/WONK axes are what keep large headings from reading generic
const display = Fraunces({
  variable: "--font-display-stack",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const sans = Inter({
  variable: "--font-sans-stack",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-stack",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${profile.name} · IT Consultant, AI & Data Science Instructor`,
    template: `%s · ${profile.name}`,
  },
  description:
    "IT Consultant and Professional AI, Data Science, and Project Management Instructor. SPBE architecture, data management (DMBOK), IT governance (COBIT 2019), and AI governance (NIST AI RMF).",
  keywords: [
    "SPBE",
    "Data Management",
    "DMBOK",
    "COBIT 2019",
    "CAPM",
    "AI Governance",
    "Data Science Instructor",
    "IT Consultant Indonesia",
  ],
  authors: [{ name: profile.name, url: profile.linkedin }],
  openGraph: {
    title: profile.name,
    description: profile.heroIntro,
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-scroll-behavior: as of Next 16 the router no longer overrides a
    // global `scroll-behavior: smooth` during navigation, so without this the
    // jump to the top of a new page animates as a long smooth scroll and fights
    // the transition. The attribute restores the instant scroll while leaving
    // smooth behaviour in place for the in-page anchor links.
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: preloaderInitScript }} />
        {/* Marks the document scripted before first paint, which is what lets
            the stylesheet keep every reveal visible when it is not. */}
        <script dangerouslySetInnerHTML={{ __html: motionInitScript }} />
      </head>
      <body className="grain flex min-h-full flex-col">
        <Preloader />
        <ImageGuard />
        <ThemeProvider>
          <LocaleProvider>
            <SmoothScrollProvider>
              {/* Fixed-layer order, since nothing here states it locally:
                  navbar z-50, grain z-60, modals z-[70], intro curtain z-[100].
                  The gap at z-[65] is where the reading-progress bar used to
                  sit; anything new pinned to the top edge belongs there. */}
              <Navbar />
              <main className="flex-1">{children}</main>
            </SmoothScrollProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
