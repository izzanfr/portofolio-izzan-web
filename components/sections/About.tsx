import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/lib/content";

export function About() {
  return (
    <Section
      id="about"
      eyebrow="About"
      title="Frameworks are only useful when someone can run them."
      tone="base"
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div className="space-y-5">
          {profile.about.map((paragraph, index) => (
            <Reveal key={index} delay={index * 0.08}>
              <p className="text-base leading-[1.75] text-muted md:text-[1.0625rem]">
                {paragraph}
              </p>
            </Reveal>
          ))}

          <Reveal delay={0.24}>
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-8 sm:grid-cols-4">
              {profile.stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="font-mono text-2xl font-semibold text-accent-strong dark:text-accent md:text-3xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-1.5 text-xs leading-snug text-muted">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal direction="left" delay={0.1} className="lg:pt-2">
          <div className="relative mx-auto w-full max-w-xs lg:mx-0">
            {/* Offset amber frame — small detail that keeps the portrait from feeling stock */}
            <div
              aria-hidden
              className="absolute -bottom-3 -right-3 h-full w-full rounded-card border border-accent/50"
            />
            {/* Square frame matches the source portrait, so `cover` never crops a face */}
            <div className="relative aspect-square overflow-hidden rounded-card border border-border bg-surface">
              <Image
                src={profile.avatar}
                alt={profile.name}
                fill
                sizes="(max-width: 1024px) 20rem, 20rem"
                className="object-cover object-center"
                priority={false}
              />
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <div>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-muted">
                Top skills
              </h3>
              <ul className="flex flex-wrap gap-2">
                {profile.topSkills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-muted">
                Languages
              </h3>
              <ul className="space-y-1.5 text-sm">
                {profile.languages.map((language) => (
                  <li key={language.name} className="flex justify-between gap-4">
                    <span>{language.name}</span>
                    <span className="text-right text-xs text-muted">{language.level}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
