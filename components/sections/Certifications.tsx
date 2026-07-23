"use client";

import { motion } from "framer-motion";
import { Award, BookOpen, GraduationCap, Mic } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { staggerChild, staggerParent } from "@/components/ui/Reveal";
import { CertificateCards } from "@/components/ui/CertificateCards";
import credentials from "@/content/certifications.json";

export function Certifications() {
  return (
    <Section
      id="credentials"
      eyebrow="Credentials"
      title="Certifications, publications & education."
      tone="base"
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h3 className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
            <Award size={14} className="text-accent-strong dark:text-accent" />
            Certifications
          </h3>
          <CertificateCards certificates={credentials.certifications} />
          <p className="mt-3 font-mono text-[11px] text-muted">Click a card to view the certificate</p>

          <h3 className="mb-5 mt-12 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
            <Mic size={14} className="text-accent-strong dark:text-accent" />
            Honors
          </h3>
          <ul className="space-y-3">
            {credentials.honors.map((honor) => (
              <li
                key={honor.title}
                className="flex items-baseline justify-between gap-4 border-b border-border pb-3 text-sm"
              >
                <span className="leading-snug">{honor.title}</span>
                <span className="shrink-0 font-mono text-xs text-muted">{honor.year}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
            <BookOpen size={14} className="text-accent-strong dark:text-accent" />
            Publications
          </h3>
          <motion.ul
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-3"
          >
            {credentials.publications.map((publication) => (
              <motion.li
                key={publication.title}
                variants={staggerChild}
                className="relative overflow-hidden rounded-card border border-border bg-surface/50 p-6"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1 bg-accent/60"
                />
                <p className="text-sm font-medium leading-relaxed text-balance">
                  {publication.title}
                </p>
                <p className="mt-2.5 font-mono text-xs text-accent-strong dark:text-accent">
                  {publication.authors}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">{publication.note}</p>
              </motion.li>
            ))}
          </motion.ul>

          <h3 className="mb-5 mt-12 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
            <GraduationCap size={14} className="text-accent-strong dark:text-accent" />
            Education
          </h3>
          <ul className="space-y-5">
            {credentials.education.map((school) => (
              <li key={school.school} className="border-b border-border pb-5 last:border-0">
                <p className="text-sm font-medium">{school.school}</p>
                <p className="mt-1 text-sm text-muted">{school.degree}</p>
                <p className="mt-1 font-mono text-xs text-muted">{school.period}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
