"use client";

import { SocialFlowMenu } from "@/components/ui/SocialFlowMenu";
import { ArrowUpRight } from "lucide-react";
import { type FormEvent } from "react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { T } from "@/components/ui/T";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { profile, profileId } from "@/lib/content";
import { pick } from "@/lib/i18n";

export function Contact() {
  const locale = useCurrentLocale();

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
  }

  return (
    <Section id="contact" index={5} transition="none" className="contact-section" contentClassName="contact-content">
      <div className="contact-layout">
        <Reveal className="contact-intro">
          <p className="contact-eyebrow"><T en="Contact" id="Kontak" /></p>
          <h2 className="contact-title">
            <T en={<>Let’s talk <em>data.</em></>} id={<>Mari bicara <em>tentang data.</em></>} />
          </h2>
          <p className="contact-description">
            <T
              en="A project to shape. A team to train. A new direction in data science. Tell me what you have in mind."
              id="Merancang proyek, melatih tim, atau memulai langkah di data science. Ceritakan apa yang ingin Anda kerjakan."
            />
          </p>
          <SocialFlowMenu />
          <div className="contact-location">
            <p className="contact-small-label"><T en="Based in Indonesia" id="Berbasis di Indonesia" /></p>
            <p><T en={profile.location} id={profileId.location} /></p>
            <p className="contact-location-note"><T en={profile.locationNote} id={profileId.locationNote} /></p>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="contact-form-wrap">
          <form onSubmit={handleSubmit} className="contact-form" aria-labelledby="contact-form-title">
            <div className="contact-form-heading">
              <h3 id="contact-form-title"><T en="What are you working on?" id="Apa yang ingin Anda kerjakan?" /></h3>
            </div>
            <div className="contact-fields">
              <label>
                <span><T en="Your name" id="Nama Anda" /></span>
                <input required name="name" autoComplete="name" maxLength={120} type="text" placeholder={pick({ en: "How should I address you?", id: "Siapa nama Anda?" }, locale)} />
              </label>
              <label>
                <span>Email</span>
                <input required name="email" autoComplete="email" type="email" placeholder="you@company.com" />
              </label>
              <label className="contact-message">
                <span><T en="A little about your plans" id="Ceritakan rencana Anda" /></span>
                <textarea required name="message" rows={4} maxLength={5000} placeholder={pick({en: "Your project, training needs, or a question you’d like to discuss…", id: "Proyek, kebutuhan pelatihan, atau pertanyaan yang ingin Anda diskusikan…"}, locale)} />
              </label>
            </div>
            <button type="submit" className="contact-submit">
              <T en="Compose email" id="Siapkan email" /><ArrowUpRight size={19} aria-hidden="true" />
            </button>
          </form>
        </Reveal>
      </div>
      <footer className="contact-footer">
        <p>© {new Date().getFullYear()} {profile.name}.</p>
        <a href="#home"><T en="Back to top" id="Kembali ke atas" /><ArrowUpRight size={15} aria-hidden="true" /></a>
      </footer>
    </Section>
  );
}
