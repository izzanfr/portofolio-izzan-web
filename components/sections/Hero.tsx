"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import { RotatingText } from "@/components/ui/RotatingText";
import { Reveal } from "@/components/ui/Reveal";
import { HeroPortrait } from "@/components/ui/HeroPortrait";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { StatCard } from "@/components/ui/StatCard";
import { TechMarquee } from "@/components/ui/TechMarquee";
import { useIntroDone } from "@/components/Preloader";
import { profile } from "@/lib/content";

const rise = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.1 + i * 0.09, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  // Hold the entrance until the intro curtain is rising, so the two read as one
  // movement instead of the hero having already played behind the overlay.
  const introDone = useIntroDone();
  const enter = introDone ? "visible" : "hidden";

  return (
    <section id="home" className="relative overflow-hidden pt-24 pb-20 md:pt-28 md:pb-28">
      {/* Ambient wash, shared with every other section. It replaces the dotted
          grid that used to sit here: with the wash, the portrait bloom and the
          drifting wordmark all in play, the grid was one texture too many. */}
      <SectionBackdrop variant="mesh" index={0} />

      <div className="container-page relative">
        {/* Top row: two-column intro, sitting over a faint drifting wordmark. */}
        <div className="relative">
          {/* Decorative backdrop, broken out to full-viewport width and clipped
              back to it, so the wordmark spans edge to edge behind the content.
              Faint enough to read as texture, only drawn on lg where there is
              room for it behind the two-column layout. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-screen -translate-x-1/2 select-none items-center overflow-hidden lg:flex"
          >
            {/* Two identical halves feed the seamless -50% drift. The separator
                gap is padding, not a trailing space, so neither half loses width
                to whitespace collapsing and the loop never jumps. */}
            <div className="marquee-wordmark w-max whitespace-nowrap font-sans text-[13vw] font-black uppercase leading-none tracking-[-0.015em] text-navy/[0.05] dark:text-white/[0.055]">
              <span className="pe-[0.32em]">Data Science • Artificial Intelligence •</span>
              <span className="pe-[0.32em]">Data Science • Artificial Intelligence •</span>
            </div>
          </div>

          <div className="relative grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="order-2 lg:order-1">
              <motion.h1
                custom={0}
                variants={rise}
                initial="hidden"
                animate={enter}
                className="text-balance text-4xl leading-[1.03] tracking-display sm:text-5xl md:text-6xl"
              >
                {profile.name}
              </motion.h1>

              <motion.p
                custom={1}
                variants={rise}
                initial="hidden"
                animate={enter}
                className="mt-5 text-xl font-medium tracking-[-0.015em] sm:text-2xl md:text-3xl"
              >
                <span className="text-muted">I work as </span>
                <RotatingText items={profile.roles} article />
              </motion.p>

              <motion.p
                custom={2}
                variants={rise}
                initial="hidden"
                animate={enter}
                className="mt-6 max-w-2xl text-base leading-[1.75] text-muted md:text-[1.0625rem]"
              >
                {profile.introBody}
              </motion.p>

              <motion.div
                custom={3}
                variants={rise}
                initial="hidden"
                animate={enter}
                className="mt-9 flex flex-wrap items-center gap-3"
              >
                <motion.a
                  href="#contact"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-medium text-white shadow-lg shadow-navy/15 transition-colors hover:bg-navy-soft dark:bg-accent dark:text-accent-contrast dark:shadow-accent/20 dark:hover:bg-accent-strong"
                >
                  Let&apos;s work together
                  <ArrowUpRight
                    size={16}
                    className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </motion.a>
              </motion.div>

              <motion.p
                custom={4}
                variants={rise}
                initial="hidden"
                animate={enter}
                className="mt-8 flex items-start gap-2 text-sm text-muted"
              >
                <MapPin size={15} className="mt-0.5 shrink-0 text-accent-strong dark:text-accent" />
                <span>
                  {profile.location}
                  <span className="block text-xs opacity-80">{profile.locationNote}</span>
                </span>
              </motion.p>
            </div>

            <motion.div
              custom={1}
              variants={rise}
              initial="hidden"
              animate={enter}
              className="order-1 lg:order-2"
            >
              {/* Capped on mobile so the photo stays a companion to the text
                  rather than filling the first screen on its own. */}
              <div className="relative mx-auto w-full max-w-[15rem] sm:max-w-[17rem] lg:max-w-none">
                <HeroPortrait />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Four separate cards rather than one divided box. Grid rows stretch by
            default, so every card matches the tallest — the short labels don't
            leave their card floating half-empty. */}
        <Reveal delay={0.1}>
          <dl className="mt-16 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:mt-20 md:gap-5 lg:grid-cols-4">
            {profile.stats.map((stat) => (
              <StatCard key={stat.label} value={stat.value} label={stat.label} />
            ))}
          </dl>
        </Reveal>

        {/* Closes off the stats before the marquee starts, so the two blocks
            don't read as one continuous run of chrome. */}
        <Reveal delay={0.1} className="mt-14">
          <div aria-hidden className="flex items-center gap-4">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-border" />
            <span className="h-1.5 w-1.5 rotate-45 bg-accent/70" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-border" />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <TechMarquee />
        </Reveal>
      </div>
    </section>
  );
}
