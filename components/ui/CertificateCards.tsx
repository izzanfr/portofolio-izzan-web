"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BadgeCheck, Expand } from "lucide-react";
import { useCallback, useState } from "react";
import { Modal } from "./Modal";
import { staggerChild, staggerParent } from "./Reveal";
import { cn } from "@/lib/utils";

export type Certificate = {
  name: string;
  issuer: string;
  date: string;
  featured: boolean;
  image: string;
  description: string;
  covers: string[];
};

export function CertificateCards({ certificates }: { certificates: Certificate[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const close = useCallback(() => setOpenIndex(null), []);
  const active = openIndex === null ? null : certificates[openIndex];

  return (
    <>
      <motion.ul
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="grid gap-4 sm:grid-cols-2"
      >
        {certificates.map((certificate, index) => (
          <motion.li key={certificate.name} variants={staggerChild}>
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
                  sizes="(max-width: 640px) 90vw, 320px"
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
                    Flagship credential
                  </span>
                )}
                <span className="block text-sm font-medium leading-snug">{certificate.name}</span>
                <span className="mt-1.5 block text-xs text-muted">{certificate.issuer}</span>
                {certificate.date && (
                  <span className="mt-1 block font-mono text-[11px] text-muted">
                    {certificate.date}
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
        label={active ? `${active.name} certificate` : "Certificate"}
        className="max-w-4xl"
      >
        {active && (
          <div>
            {/* object-contain so landscape and portrait scans both display whole */}
            <div className="grid place-items-center bg-navy p-4 md:p-6">
              <Image
                src={active.image}
                alt={`${active.name} certificate`}
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
                {active.date && <span className="font-mono"> · {active.date}</span>}
              </p>

              <p className="mt-5 text-sm leading-[1.75] text-muted">{active.description}</p>

              {active.covers.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    What it covers
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {active.covers.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs"
                      >
                        {item}
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
