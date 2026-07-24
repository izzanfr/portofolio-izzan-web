import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider, themeInitScript } from "@/components/providers/ThemeProvider";
import { LocaleProvider, localeInitScript } from "@/components/providers/LocaleProvider";
import { Preloader, preloaderInitScript } from "@/components/Preloader";
import { ImageGuard } from "@/components/ImageGuard";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { profile } from "@/lib/content";

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: preloaderInitScript }} />
      </head>
      <body className="grain flex min-h-full flex-col">
        <Preloader />
        <ImageGuard />
        <ThemeProvider>
          <LocaleProvider>
            <ScrollProgress />
            <Navbar />
            <main className="flex-1">{children}</main>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
