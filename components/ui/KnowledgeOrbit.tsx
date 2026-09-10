"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { T } from "./T";
import { DynamicIcon } from "./DynamicIcon";
import type { BiRole } from "@/lib/experience";

const NODES = [
  { x: 52, y: 12, label: "IT CONSULTING" },
  { x: 83, y: 28, label: "DATA SCIENCE" },
  { x: 88, y: 61, label: "ARTIFICIAL INTELLIGENCE" },
  { x: 65, y: 85, label: "BIG DATA" },
  { x: 30, y: 83, label: "PROJECT MANAGEMENT" },
  { x: 12, y: 53, label: "DATA MANAGEMENT" },
  { x: 22, y: 22, label: "DIGITAL SKILLS" },
];

/** Custom SVG/CSS geometry; photographs are the original portfolio assets. */
export function KnowledgeOrbit({ roles, activeRole, paused }: { roles: BiRole[]; activeRole: number; paused: boolean }) {
  const [photoOffset, setPhotoOffset] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);
  const photos = roles[activeRole]?.photos ?? [];
  useEffect(() => {
    if (paused || photos.length < 4) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && hostRef.current?.closest("[data-journey-visible]")) {
        setPhotoOffset((offset) => (offset + 1) % photos.length);
      }
    }, 6000);
    return () => window.clearInterval(timer);
  }, [photos.length, paused]);

  return (
    <div ref={hostRef} className="knowledge-orbit" data-foundation={activeRole < 0}>
      <div className="orbit-halo" />
      <div className="orbit-system">
        <div className="orbit-plane orbit-plane-one" /><div className="orbit-plane orbit-plane-two" /><div className="orbit-plane orbit-plane-three" />
        <svg className="orbit-connections" viewBox="0 0 100 100" fill="none">
          {NODES.map(({ x, y }, i) => <path key={i} className="orbit-branch" d={`M50 50 Q${50 + (x - 50) * 0.2} ${y} ${x} ${y}`} pathLength="1" strokeDasharray="1" />)}
          <circle cx="50" cy="50" r="34" className="orbit-guide" strokeDasharray="0.5 2" />
        </svg>
        <div className="orbit-core"><div className="orbit-core-glass" /><div className="orbit-core-ring" /><div className="orbit-core-type"><span>{activeRole < 0 ? "2021" : "IF"}</span><small>{activeRole < 0 ? <T en="THE BEGINNING" id="TITIK AWAL" /> : "INIXINDO JOGJA"}</small></div></div>
        {roles.map((role, index) => {
          const node = NODES[index % NODES.length];
          return <div key={role.slug} className="orbit-node" data-active={index === activeRole} data-reached={activeRole >= index} style={{ left: `${node.x}%`, top: `${node.y}%` }}><span className="orbit-node-icon"><DynamicIcon name={role.icon} size={22} /></span><span className="orbit-node-label">{node.label}</span></div>;
        })}
      </div>
      <div className="orbit-photographs" key={activeRole}>
        {photos.slice(0, 3).map((_, i) => {
          const photo = photos[(photoOffset + i) % photos.length];
          return <div className={`orbit-photo orbit-photo-${i}`} key={i} style={{ "--float-delay": `${-i * 3}s` } as CSSProperties}>
            <div className="orbit-photo-image" key={photo.src}><Image src={photo.src} alt="" fill sizes="(min-width: 1000px) 240px, 1px" className="object-cover" /></div>
            <span className="orbit-photo-meta"><span className="orbit-photo-dot" />FIELD NOTES · {String(i + 1).padStart(2, "0")}</span>
          </div>;
        })}
      </div>
      <div className="orbit-coordinate orbit-coordinate-a">KNOWLEDGE / {String(Math.max(0, activeRole + 1)).padStart(2, "0")}</div>
      <div className="orbit-coordinate orbit-coordinate-b">2022 — <T en="PRESENT" id="SEKARANG" /></div>
    </div>
  );
}
