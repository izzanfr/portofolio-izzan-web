"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, MapPin } from "lucide-react";
import { RotatingText } from "@/components/ui/RotatingText";
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
    <section
      id="home"
      className="relative flex min-h-[92svh] items-center overflow-hidden pt-24 md:pt-28"
    >
      {/* Ambient background: dotted grid fading out, plus one warm amber bloom */}
      <div
        aria-hidden
        className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_35%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-24 h-[32rem] w-[32rem] rounded-full bg-accent/12 blur-[120px] dark:bg-accent/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full bg-navy/10 blur-[110px] dark:bg-navy-soft/40"
      />

      <div className="container-page relative">
        {/* Photo leads on mobile, then swaps into the right-hand column at lg so
            the text keeps the natural reading position on wide screens. */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
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
              <span className="text-muted">I work as an </span>
              <RotatingText items={profile.roles} />
            </motion.p>

            <motion.p
              custom={2}
              variants={rise}
              initial="hidden"
              animate={enter}
              className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg"
            >
              {profile.heroIntro}
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
              {/* Offset amber frame, carried over from the old About portrait */}
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
                  sizes="(max-width: 640px) 15rem, (max-width: 1024px) 17rem, 30rem"
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#about"
        aria-label="Scroll to about section"
        initial={{ opacity: 0 }}
        animate={{ opacity: introDone ? 1 : 0 }}
        transition={{ delay: 1.1 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 text-muted transition-colors hover:text-accent-strong md:block dark:hover:text-accent"
      >
        <motion.span
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="block"
        >
          <ArrowDown size={18} />
        </motion.span>
      </motion.a>
    </section>
  );
}
