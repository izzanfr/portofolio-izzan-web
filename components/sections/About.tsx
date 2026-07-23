import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { TechMarquee } from "@/components/ui/TechMarquee";
import { profile } from "@/lib/content";

export function About() {
  return (
    <Section
      id="about"
      eyebrow="About"
      title="Frameworks are only useful when someone can run them."
      tone="base"
    >
      <div className="max-w-3xl space-y-5">
        {profile.about.map((paragraph, index) => (
          <Reveal key={index} delay={index * 0.08}>
            <p className="text-base leading-[1.75] text-muted md:text-[1.0625rem]">{paragraph}</p>
          </Reveal>
        ))}
      </div>

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

      <Reveal delay={0.1} className="mt-14">
        <TechMarquee />
      </Reveal>
    </Section>
  );
}
