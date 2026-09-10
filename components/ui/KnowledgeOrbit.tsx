"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { IconType } from "react-icons";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { RiOpenaiFill } from "react-icons/ri";
import { SiApachehadoop, SiApachespark, SiClaude, SiJupyter, SiMiro, SiPython } from "react-icons/si";
import { T } from "./T";
import type { BiJob, BiPhoto, BiRole } from "@/lib/experience";

// Orbit geometry only; which role sits where follows the roles' order.
const POSITIONS = [
  { x: 52, y: 12 }, { x: 83, y: 28 }, { x: 88, y: 61 }, { x: 65, y: 85 },
  { x: 30, y: 83 }, { x: 12, y: 53 }, { x: 22, y: 22 },
];

/**
 * A node shows the real tools, frameworks and bodies behind a role: brand
 * glyphs tinted to their brand colour, or an official logo file from
 * /public/logos.
 */
type Mark = { Icon: IconType; color: string } | { src: string; size?: number };

// Keyed by role slug, so adding or reordering roles never mislabels another.
const STACKS: Record<string, { label: string; primary: Mark; secondary?: Mark }> = {
  "it-consultant": { label: "IT CONSULTING", primary: { src: "/logos/spbe.png", size: 36 } },
  "data-science-instructor": { label: "DATA SCIENCE", primary: { Icon: SiPython, color: "#3776AB" }, secondary: { Icon: SiJupyter, color: "#F37626" } },
  "ai-instructor": { label: "ARTIFICIAL INTELLIGENCE", primary: { Icon: RiOpenaiFill, color: "#0D0D0D" }, secondary: { Icon: SiClaude, color: "#D97757" } },
  "big-data-instructor": { label: "BIG DATA", primary: { Icon: SiApachespark, color: "#E25A1C" }, secondary: { Icon: SiApachehadoop, color: "#3E9ED9" } },
  "project-management-instructor": { label: "PROJECT MANAGEMENT", primary: { src: "/logos/Microsoft%20Project.svg" } },
  "data-management-instructor": { label: "DATA MANAGEMENT", primary: { src: "/logos/dama.jpeg", size: 30 } },
  "digital-skills-instructor": { label: "DIGITAL SKILLS", primary: { Icon: PiMicrosoftExcelLogoFill, color: "#217346" }, secondary: { Icon: SiMiro, color: "#050038" } },
};

function MarkGlyph({ mark, size }: { mark: Mark; size: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  if ("src" in mark) return <img src={mark.src} alt="" className="orbit-node-logo" style={{ height: mark.size ?? size, width: "auto" }} />;
  return <mark.Icon size={size} style={{ color: mark.color }} />;
}

function eraYears(job: BiJob) {
  const years = [...new Set(job.period.en.match(/\d{4}/g) ?? [])];
  if (job.current) return <>{years[0]} — <T en="Now" id="Kini" /></>;
  return years.join(" — ");
}

/** Custom SVG/CSS geometry; photographs and logos are the original assets. */
export function KnowledgeOrbit({ roles, activeSlug, photos, companies, activeCompany }: {
  roles: BiRole[];
  activeSlug: string;
  photos: BiPhoto[];
  companies: BiJob[];
  activeCompany: number;
}) {
  const [photoOffset, setPhotoOffset] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const activeIndex = roles.findIndex((role) => role.slug === activeSlug);
  const company = companies[activeCompany];
  useEffect(() => {
    if (photos.length < 4) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && hostRef.current?.closest("[data-journey-visible]")) {
        setPhotoOffset((offset) => (offset + 1) % photos.length);
      }
    }, 6000);
    return () => window.clearInterval(timer);
  }, [photos.length]);

  return (
    <div ref={hostRef} className="knowledge-orbit" data-foundation={activeIndex < 0}>
      <div className="orbit-halo" />
      <div className="orbit-era" key={activeCompany}>
        <span className="orbit-era-year">{eraYears(company)}</span>
        <span className="orbit-era-meta"><T en={company.period.en} id={company.period.id} /> · <T en={company.duration.en} id={company.duration.id} /></span>
      </div>
      <div className="orbit-system">
        <div className="orbit-plane orbit-plane-one" /><div className="orbit-plane orbit-plane-two" /><div className="orbit-plane orbit-plane-three" />
        <svg className="orbit-connections" viewBox="0 0 100 100" fill="none">
          {roles.map((role, i) => {
            const { x, y } = POSITIONS[i % POSITIONS.length];
            return <path key={role.slug} className="orbit-branch" d={`M50 50 Q${50 + (x - 50) * 0.2} ${y} ${x} ${y}`} pathLength="1" strokeDasharray="1" />;
          })}
          <circle cx="50" cy="50" r="34" className="orbit-guide" strokeDasharray="0.5 2" />
        </svg>
        <div className="orbit-core">
          <div className="orbit-core-glass" /><div className="orbit-core-ring" />
          {companies.map((job, i) => job.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={job.company} src={job.logo} alt="" className="orbit-core-logo" data-active={i === activeCompany} />
          ))}
        </div>
        {roles.map((role, index) => {
          const { x, y } = POSITIONS[index % POSITIONS.length];
          const stack = STACKS[role.slug];
          return (
            <div key={role.slug} className="orbit-node" data-active={index === activeIndex} data-reached={activeIndex >= index} style={{ left: `${x}%`, top: `${y}%` }}>
              <span className="orbit-node-icon">
                {stack ? <MarkGlyph mark={stack.primary} size={24} /> : null}
                {stack?.secondary && <span className="orbit-node-badge"><MarkGlyph mark={stack.secondary} size={12} /></span>}
              </span>
              <span className="orbit-node-label">{stack?.label ?? role.title.en.toUpperCase()}</span>
            </div>
          );
        })}
      </div>
      <div className="orbit-photographs" key={activeSlug}>
        {photos.slice(0, 3).map((_, i) => {
          const photo = photos[(photoOffset + i) % photos.length];
          return <div className={`orbit-photo orbit-photo-${i}`} key={i} style={{ "--float-delay": `${-i * 3}s` } as CSSProperties}>
            <div className="orbit-photo-image" key={photo.src}><Image src={photo.src} alt="" fill sizes="(min-width: 1000px) 240px, 1px" className="object-cover" /></div>
            <span className="orbit-photo-meta"><span className="orbit-photo-dot" />FIELD NOTES · {String(i + 1).padStart(2, "0")}</span>
          </div>;
        })}
      </div>
      <div className="orbit-coordinate orbit-coordinate-a">KNOWLEDGE / {String(activeIndex + 1).padStart(2, "0")}</div>
    </div>
  );
}
