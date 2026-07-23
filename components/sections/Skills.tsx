"use client";

import { motion } from "framer-motion";
import { Section } from "@/components/ui/Section";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { staggerChild, staggerParent } from "@/components/ui/Reveal";
import skills from "@/content/skills.json";

export function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="Skills"
      title="What I build with, assess against, and teach."
      tone="base"
    >
      <motion.div
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="grid gap-5 sm:grid-cols-2"
      >
        {skills.map((group) => (
          <motion.article
            key={group.group}
            variants={staggerChild}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="group relative overflow-hidden rounded-card border border-border bg-surface/60 p-6 transition-colors duration-300 hover:border-accent/50"
          >
            {/* Amber wash that only shows on hover */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
            />
            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-white transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-contrast dark:bg-surface-2 dark:text-accent">
                  <DynamicIcon name={group.icon} size={18} />
                </span>
                <h3 className="text-lg tracking-[-0.018em]">{group.group}</h3>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-muted">{group.description}</p>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-foreground transition-colors duration-200 hover:border-accent hover:text-accent-strong dark:hover:text-accent"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </Section>
  );
}
