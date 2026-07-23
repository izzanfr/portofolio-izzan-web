"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Mail, MapPin, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { LinkedInIcon } from "@/components/ui/icons";
import { profile } from "@/lib/content";

const inputClass =
  "w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm outline-none transition-colors duration-200 placeholder:text-muted/70 focus:border-accent";

export function Contact() {
  const [sent, setSent] = useState(false);

  // No backend yet — compose a mailto: so the message lands in the visitor's own client
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const message = String(form.get("message") ?? "");

    const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Got a data challenge worth talking through?"
      lead="Consulting engagements, training programs, or a conversation about switching into data science are all welcome."
      tone="base"
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal className="space-y-4">
          <a
            href={`mailto:${profile.email}`}
            className="group flex items-center gap-4 rounded-card border border-border bg-surface/60 p-5 transition-colors duration-300 hover:border-accent/55"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy text-white transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-contrast dark:bg-surface-2 dark:text-accent">
              <Mail size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                Email
              </span>
              <span className="block truncate text-sm font-medium">{profile.email}</span>
            </span>
            <ArrowUpRight
              size={16}
              className="shrink-0 text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>

          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-center gap-4 rounded-card border border-border bg-surface/60 p-5 transition-colors duration-300 hover:border-accent/55"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy text-white transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-contrast dark:bg-surface-2 dark:text-accent">
              <LinkedInIcon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                LinkedIn
              </span>
              <span className="block truncate text-sm font-medium">{profile.linkedinLabel}</span>
            </span>
            <ArrowUpRight
              size={16}
              className="shrink-0 text-muted transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>

          <div className="flex items-start gap-4 rounded-card border border-border bg-surface/40 p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent-strong dark:text-accent">
              <MapPin size={18} />
            </span>
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                Based in
              </span>
              <span className="block text-sm font-medium">{profile.location}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                {profile.locationNote}
              </span>
            </span>
          </div>
        </Reveal>

        <Reveal direction="left" delay={0.1}>
          <form
            onSubmit={handleSubmit}
            className="rounded-card border border-border bg-surface/60 p-6 md:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-muted">Name</span>
                <input required name="name" type="text" placeholder="Your name" className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-muted">Email</span>
                <input
                  required
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  className={inputClass}
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-medium text-muted">Message</span>
              <textarea
                required
                name="message"
                rows={5}
                placeholder="Tell me about the project, training need, or question."
                className={`${inputClass} resize-y`}
              />
            </label>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-navy-soft dark:bg-accent dark:text-accent-contrast dark:hover:bg-accent-strong"
            >
              <Send size={15} />
              Send message
            </motion.button>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              {sent
                ? "Your email client should have opened with the message ready to send."
                : "This opens your own email client with the message pre-filled. Nothing is stored here."}
            </p>
          </form>
        </Reveal>
      </div>

      {/* Carried over from the deleted footer: the copyright was the only thing
          there not already covered by this section. */}
      <p className="mt-16 border-t border-border pt-6 text-xs text-muted">
        © {new Date().getFullYear()} {profile.name}. All rights reserved.
      </p>
    </Section>
  );
}
