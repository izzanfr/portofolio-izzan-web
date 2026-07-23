"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { Section } from "@/components/ui/Section";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import {
  ExperienceGallery,
  type ExperiencePhoto,
} from "@/components/ui/ExperienceGallery";
import { cn } from "@/lib/utils";
import experience from "@/content/experience.json";

type Role = {
  title: string;
  slug: string;
  icon: string;
  points: string[];
  photos: ExperiencePhoto[];
};

function RoleAccordion({ role, index }: { role: Role; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <motion.li
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group rounded-card border transition-colors duration-300",
        open
          ? "border-accent/45 bg-surface"
          : "border-border bg-surface/50 hover:border-accent/35",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors duration-300",
            open
              ? "bg-accent text-accent-contrast"
              : "bg-surface-2 text-muted group-hover:text-accent-strong dark:group-hover:text-accent",
          )}
        >
          <DynamicIcon name={role.icon} size={17} />
        </span>
        <span className="flex-1 text-sm font-medium md:text-base">{role.title}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="shrink-0 text-muted"
        >
          <ChevronDown size={17} />
        </motion.span>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <ul className="space-y-2.5 px-5 pb-5 pl-[4.25rem] text-sm leading-relaxed text-muted">
          {role.points.map((point) => (
            <li key={point} className="relative pl-4">
              <span className="absolute left-0 top-[0.6em] h-1 w-1 rounded-full bg-accent" />
              {point}
            </li>
          ))}
        </ul>

        <ExperienceGallery photos={role.photos} roleTitle={role.title} />
      </motion.div>
    </motion.li>
  );
}

export function Experience() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 65%", "end 60%"],
  });
  // Spring the timeline fill so it trails the scroll slightly instead of snapping
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });
  const scaleY = useTransform(progress, (v) => Math.max(v, 0.02));

  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title="Four years of delivery, taught back to the room."
      lead="Seven parallel roles at Inixindo Jogja — consulting engagements feeding the training curriculum, and the classroom sharpening how the consulting gets explained."
      tone="tint"
    >
      <div ref={trackRef} className="relative">
        {/* Scroll-linked timeline spine */}
        <div className="absolute left-[7px] top-2 hidden h-[calc(100%-1rem)] w-px bg-border md:block">
          <motion.div
            style={{ scaleY, originY: 0 }}
            className="h-full w-full bg-gradient-to-b from-accent to-accent/30"
          />
        </div>

        <div className="space-y-14 md:space-y-20 md:pl-10">
          {experience.map((job) => (
            <div key={job.company} className="relative">
              <span
                aria-hidden
                className="absolute -left-10 top-2 hidden h-[15px] w-[15px] rounded-full border-2 border-background bg-accent md:block"
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="mb-6"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-xl tracking-[-0.024em] md:text-2xl">
                    {job.company}
                  </h3>
                  {job.current && (
                    <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-strong dark:text-accent">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-1.5 font-mono text-xs text-muted">
                  {job.period} · {job.duration} · {job.location}
                </p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{job.summary}</p>
              </motion.div>

              <ul className="space-y-2.5">
                {job.roles.map((role, index) => (
                  <RoleAccordion key={role.title} role={role} index={index} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
