"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Download, MapPin } from "lucide-react";
import { RotatingText } from "@/components/ui/RotatingText";
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
        <div className="max-w-4xl">
          <motion.p
            custom={0}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Available for consulting &amp; training engagements
          </motion.p>

          <motion.h1
            custom={1}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {profile.name}
            <span className="ml-2 align-super font-mono text-base text-accent-strong dark:text-accent md:text-xl">
              {profile.credential}
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mt-5 text-xl font-medium tracking-tight sm:text-2xl md:text-3xl"
          >
            <span className="text-muted">I work as an </span>
            <RotatingText items={profile.roles} />
          </motion.p>

          <motion.p
            custom={3}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg"
          >
            {profile.heroIntro}
          </motion.p>

          <motion.div
            custom={4}
            variants={rise}
            initial="hidden"
            animate="visible"
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
            <motion.a
              href={profile.cvUrl}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-6 py-3.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent-strong dark:hover:text-accent"
            >
              <Download size={16} />
              Download CV
            </motion.a>
          </motion.div>

          <motion.p
            custom={5}
            variants={rise}
            initial="hidden"
            animate="visible"
            className="mt-8 flex items-start gap-2 text-sm text-muted"
          >
            <MapPin size={15} className="mt-0.5 shrink-0 text-accent-strong dark:text-accent" />
            <span>
              {profile.location}
              <span className="block text-xs opacity-80">{profile.locationNote}</span>
            </span>
          </motion.p>
        </div>
      </div>

      <motion.a
        href="#about"
        aria-label="Scroll to about section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
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
