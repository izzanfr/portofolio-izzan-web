"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Mail, MapPin, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { LinkedInIcon } from "@/components/ui/icons";
import { T } from "@/components/ui/T";
import { Scramble } from "@/components/ui/Scramble";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { profile, profileId } from "@/lib/content";
import { pick } from "@/lib/i18n";
import { EASE, REVEAL_DISTANCE, REVEAL_DURATION, VIEWPORT } from "@/lib/motion";

const inputClass =
  "w-full rounded-xl border border-border bg-background/70 px-4 py-3 text-sm outline-none transition-colors duration-200 placeholder:text-muted/70 focus:border-accent";

export function Contact() {
  const [sent, setSent] = useState(false);
  const locale = useCurrentLocale();
  const reduceMotion = useReducedMotion();

  // No backend yet — compose a mailto: so the message lands in the visitor's own client
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const message = String(form.get("message") ?? "");

    const subjectText = pick(
      { en: `Portfolio enquiry from ${name}`, id: `Pertanyaan portofolio dari ${name}` },
      locale,
    );
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(`${message}\n\n${name}\n${email}`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <Section
      id="contact"
      title={<T en="Contact" id="Kontak" />}
      lead={
        <T
          en="Got a data challenge worth talking through? Consulting engagements, training programs, or a conversation about switching into data science are all welcome."
          id="Punya tantangan data yang layak didiskusikan? Penugasan konsultasi, program pelatihan, atau sekadar obrolan tentang alih karier ke data science, semuanya saya sambut."
        />
      }
      tone="base"
      index={4}
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <Reveal direction="right" className="space-y-4">
          <a
            href={`mailto:${profile.email}`}
            className="group flex items-center gap-4 rounded-card border border-border bg-surface/60 p-5 transition-colors duration-300 hover:border-accent/55"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy text-white transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-contrast dark:bg-surface-2 dark:text-accent">
              <Mail size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                <Scramble text="Email" />
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
                <Scramble text="LinkedIn" />
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
                <Scramble en="Based in" id="Berbasis di" />
              </span>
              <span className="block text-sm font-medium">
                <T en={profile.location} id={profileId.location} />
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                <T en={profile.locationNote} id={profileId.locationNote} />
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
                <span className="mb-2 block text-xs font-medium text-muted">
                  <T en="Name" id="Nama" />
                </span>
                <input
                  required
                  name="name"
                  type="text"
                  placeholder={pick({ en: "Your name", id: "Nama Anda" }, locale)}
                  className={inputClass}
                />
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
              <span className="mb-2 block text-xs font-medium text-muted">
                <T en="Message" id="Pesan" />
              </span>
              <textarea
                required
                name="message"
                rows={5}
                placeholder={pick(
                  {
                    en: "Tell me about the project, training need, or question.",
                    id: "Ceritakan tentang proyek, kebutuhan pelatihan, atau pertanyaan Anda.",
                  },
                  locale,
                )}
                className={`${inputClass} resize-y`}
              />
            </label>

            {/* The button follows the form in rather than arriving with it: the
                fields are what the visitor reads first, and the call to action
                landing a beat later is what draws the eye down to it. A quarter
                second — long enough to register as a sequence, short enough
                that nobody ready to click is kept waiting. */}
            <motion.button
              type="submit"
              data-reveal
              initial={reduceMotion ? false : { opacity: 0, y: REVEAL_DISTANCE }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: REVEAL_DURATION, delay: 0.25, ease: EASE }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-navy-soft dark:bg-accent dark:text-accent-contrast dark:hover:bg-accent-strong"
            >
              <Send size={15} />
              <T en="Send message" id="Kirim pesan" />
            </motion.button>

            <p className="mt-4 text-center text-xs leading-relaxed text-muted">
              {sent ? (
                <T
                  en="Your email client should have opened with the message ready to send."
                  id="Aplikasi email Anda semestinya terbuka dengan pesan siap dikirim."
                />
              ) : (
                <T
                  en="This opens your own email client with the message pre-filled. Nothing is stored here."
                  id="Ini membuka aplikasi email Anda sendiri dengan pesan yang sudah terisi. Tidak ada data yang disimpan di sini."
                />
              )}
            </p>
          </form>
        </Reveal>
      </div>

      {/* Carried over from the deleted footer: the copyright was the only thing
          there not already covered by this section. */}
      <p className="mt-16 border-t border-border pt-6 text-xs text-muted">
        © {new Date().getFullYear()} {profile.name}.{" "}
        <T en="All rights reserved." id="Hak cipta dilindungi." />
      </p>
    </Section>
  );
}
