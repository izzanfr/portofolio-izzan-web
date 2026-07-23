import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider, themeInitScript } from "@/components/providers/ThemeProvider";
import { profile } from "@/lib/content";

const sans = Plus_Jakarta_Sans({
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
    default: `${profile.name}, ${profile.credential} — IT Consultant & AI/Data Science Instructor`,
    template: `%s — ${profile.name}`,
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
    title: `${profile.name}, ${profile.credential}`,
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
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="grain flex min-h-full flex-col">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
