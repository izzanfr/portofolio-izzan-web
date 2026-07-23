import Link from "next/link";
import { Mail } from "lucide-react";
import { LinkedInIcon } from "@/components/ui/icons";
import { navLinks, profile } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="font-display text-base tracking-[-0.02em]">
            {profile.name}
            <span className="text-accent-strong dark:text-accent">.</span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-muted">{profile.locationNote}</p>
          <div className="mt-5 flex items-center gap-2">
            <a
              href={`mailto:${profile.email}`}
              aria-label="Email"
              className="grid h-10 w-10 place-items-center rounded-full border border-border transition-colors hover:border-accent hover:text-accent-strong dark:hover:text-accent"
            >
              <Mail size={16} />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="LinkedIn"
              className="grid h-10 w-10 place-items-center rounded-full border border-border transition-colors hover:border-accent hover:text-accent-strong dark:hover:text-accent"
            >
              <LinkedInIcon size={16} />
            </a>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3 md:grid-cols-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted transition-colors hover:text-accent-strong dark:hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border/60">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>
          <p className="font-mono">Built with Next.js, Tailwind CSS &amp; Framer Motion</p>
        </div>
      </div>
    </footer>
  );
}
