"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Expand } from "lucide-react";
import { useCallback, useState } from "react";
import { Modal } from "./Modal";
import { T } from "./T";
import { Scramble } from "./Scramble";
import { staggerChild, staggerParent } from "./Reveal";
import { VIEWPORT } from "@/lib/motion";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { pick } from "@/lib/i18n";
import type { Certificate } from "@/lib/certifications";
import { cn } from "@/lib/utils";

export function CertificateCards({ certificates }: { certificates: Certificate[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const active = openIndex === null ? null : certificates[openIndex];
  const locale = useCurrentLocale();
  const reduceMotion = useReducedMotion();

  return (
    <>
      {/* One reveal, eighty milliseconds apart down the grid — the cards arrive
          as a run rather than all at once, which is what makes a long list of
          credentials read as a sequence you can follow. Under reduced motion
          the whole grid starts in its resting state and nothing staggers. */}
      <motion.ul
        variants={staggerParent}
        initial={reduceMotion ? "visible" : "hidden"}
        whileInView="visible"
        viewport={VIEWPORT}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {certificates.map((certificate, index) => (
          <motion.li key={certificate.name} data-reveal variants={staggerChild}>
            <motion.button
              type="button"
              onClick={() => setOpenIndex(index)}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className={cn(
                "group flex h-full w-full flex-col overflow-hidden rounded-card border text-left transition-colors duration-300",
                certificate.featured
                  ? "border-accent/45 bg-accent/[0.06]"
                  : "border-border bg-surface/50 hover:border-accent/45",
              )}
            >
              <span className="relative block aspect-[4/3] w-full overflow-hidden border-b border-border bg-surface-2">
                <Image
                  src={certificate.image}
                  alt={certificate.name}
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <span className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-background/85 text-muted opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100 group-hover:text-accent-strong dark:group-hover:text-accent">
                  <Expand size={14} />
                </span>
              </span>

              <span className="flex flex-1 flex-col p-5">
                {certificate.featured && (
                  <span className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-strong dark:text-accent">
                    <BadgeCheck size={12} />
                    <Scramble en="Flagship credential" id="Kredensial unggulan" />
                  </span>
                )}
                <span className="block text-sm font-medium leading-snug">{certificate.name}</span>
                <span className="mt-1.5 block text-xs text-muted">{certificate.issuer}</span>
                {certificate.date.en && (
                  <span className="mt-1 block font-mono text-[11px] text-muted">
                    <Scramble en={certificate.date.en} id={certificate.date.id} />
                  </span>
                )}
              </span>
            </motion.button>
          </motion.li>
        ))}
      </motion.ul>

      <Modal
        open={active !== null}
        onClose={close}
        label={
          active
            ? `${active.name} ${pick({ en: "certificate", id: "sertifikat" }, locale)}`
            : pick({ en: "Certificate", id: "Sertifikat" }, locale)
        }
        className="max-w-4xl"
      >
        {active && (
          <div>
            {/* object-contain so landscape and portrait scans both display whole */}
            <div className="grid place-items-center bg-navy p-4 md:p-6">
              <Image
                src={active.image}
                alt={`${active.name} ${pick({ en: "certificate", id: "sertifikat" }, locale)}`}
                width={1600}
                height={1131}
                sizes="90vw"
                className="max-h-[62vh] w-auto max-w-full rounded-md object-contain"
              />
            </div>

            <div className="p-6 md:p-8">
              <h3 className="text-xl tracking-[-0.022em] md:text-2xl">{active.name}</h3>
              <p className="mt-2 text-sm text-muted">
                {active.issuer}
                {active.date.en && (
                  <span className="font-mono">
                    {" "}
                    · <T en={active.date.en} id={active.date.id} />
                  </span>
                )}
              </p>

              <p className="mt-5 text-sm leading-[1.75] text-muted">
                <T en={active.description.en} id={active.description.id} />
              </p>

              {active.covers.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    <T en="What it covers" id="Yang dicakup" />
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {active.covers.map((item, i) => (
                      <li
                        key={i}
                        className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs"
                      >
                        <T en={item.en} id={item.id} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
