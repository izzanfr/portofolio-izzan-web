"use client";

import { useCallback, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useLenisRef } from "@/components/providers/SmoothScrollProvider";
import { T } from "@/components/ui/T";
import { KnowledgeOrbit } from "@/components/ui/KnowledgeOrbit";
import { getExperience } from "@/lib/experience";
import { JOURNEY_MEDIA } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Each role gets its own moment; all content remains in reading order without JS.
const jobs = [...getExperience()].reverse();
const chapters = jobs.flatMap((job, companyIndex) =>
  job.roles.map((role, roleIndex) => ({ job, role, companyIndex, roleIndex })),
);
const orbitRoles = jobs.flatMap((job) => job.roles.length > 1 ? job.roles : []);
// Scroll per chapter, in viewport heights. Chapter i owns timeline time
// [i - LEAD, i + 1 - LEAD); the last one ends a short tail after its start.
const CHAPTER_DISTANCE = 0.65;
const CHAPTER_LEAD = 0.35;
const SPAN = chapters.length - 0.7;

export function Experience() {
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const lenisRef = useLenisRef();
  const [active, setActive] = useState(0);
  const chapter = chapters[active];

  const goTo = useCallback((index: number) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const target = trigger.start + (index / SPAN) * (trigger.end - trigger.start);
    const lenis = lenisRef?.current;
    if (lenis) lenis.scrollTo(target);
    else window.scrollTo({ top: target, behavior: "smooth" });
  }, [lenisRef]);

  useGSAP(() => {
    const root = rootRef.current;
    const frame = frameRef.current;
    if (!root || !frame) return;
    const mm = gsap.matchMedia();
    mm.add(JOURNEY_MEDIA, () => {
      const zone = root.closest<HTMLElement>(".overlap-under");
      const panels = gsap.utils.toArray<HTMLElement>(".journey-chapter", root);
      const system = root.querySelector(".orbit-system");
      const progress = root.querySelector(".journey-progress-fill");
      const distance = () => frame.clientHeight * SPAN * CHAPTER_DISTANCE;
      root.setAttribute("data-journey-ready", "");
      zone?.setAttribute("data-experience-pinned", "");

      // Projects rises during this last viewport, after the final role is read.
      ScrollTrigger.create({
        trigger: root, start: "top top", end: () => `+=${distance() + frame.clientHeight}`,
        pin: frame, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 2,
        onToggle: ({ isActive }) => root.toggleAttribute("data-journey-visible", isActive),
      });

      let current = -1;
      let disposed = false;
      // Chapters are played, not scrubbed: crossing a threshold starts a short
      // eased crossfade. Scrubbing them made a notched mouse wheel step the
      // fade frame by frame, and left text half-faded wherever scrolling stopped.
      const syncChapter = (index: number) => {
        if (disposed || !window.matchMedia(JOURNEY_MEDIA).matches || index === current) return;
        const previous = current;
        const forward = index > previous;
        current = index;
        panels.forEach((panel, i) => {
          panel.inert = i !== index;
          panel.setAttribute("aria-hidden", String(i !== index));
        });
        if (previous >= 0) {
          gsap.to(panels[previous], { autoAlpha: 0, y: forward ? -24 : 24, duration: 0.3, ease: "power2.in", overwrite: true });
          gsap.fromTo(panels[index], { autoAlpha: 0, y: forward ? 28 : -28 },
            { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.12, ease: "power3.out", overwrite: true });
        }
        setActive(index);
      };
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root, start: "top top", end: () => `+=${distance()}`,
          // Smoothing for the ambient motion only. The chapter is read from the
          // live scroll progress, not from this lagging timeline.
          scrub: 0.5, invalidateOnRefresh: true,
          onUpdate: (self) => syncChapter(Math.min(chapters.length - 1, Math.floor(self.progress * SPAN + CHAPTER_LEAD))),
        },
      });
      triggerRef.current = timeline.scrollTrigger ?? null;
      timeline.to({}, { duration: SPAN }, 0);
      gsap.set(panels, { autoAlpha: 0, y: 0 });
      gsap.set(panels[0], { autoAlpha: 1 });
      syncChapter(0);
      if (system) timeline.fromTo(system,
        { rotationY: -32, rotationX: 14, rotationZ: -12, scale: 0.76 },
        { rotationY: 22, rotationX: -8, rotationZ: 6, scale: 1, duration: SPAN }, 0);
      if (progress) timeline.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: SPAN }, 0);
      // Branch k belongs to chapter k + 1, which takes over at time k + 1 - LEAD.
      root.querySelectorAll(".orbit-branch").forEach((branch, index) => timeline.fromTo(branch,
        { strokeDashoffset: 1, opacity: 0.15 },
        { strokeDashoffset: 0, opacity: 0.8, duration: 0.5 }, Math.min(index + 0.4, SPAN - 0.5)));

      let timer: ReturnType<typeof setTimeout>;
      const refresh = () => { clearTimeout(timer); timer = setTimeout(() => ScrollTrigger.refresh(), 160); };
      const observer = new ResizeObserver(refresh);
      observer.observe(frame);
      window.addEventListener("load", refresh);
      refresh();
      return () => {
        disposed = true;
        clearTimeout(timer);
        observer.disconnect();
        window.removeEventListener("load", refresh);
        triggerRef.current = null;
        root.removeAttribute("data-journey-ready");
        root.removeAttribute("data-journey-visible");
        zone?.removeAttribute("data-experience-pinned");
        gsap.killTweensOf(panels);
        gsap.set(panels, { clearProps: "opacity,visibility,transform,filter" });
        panels.forEach((panel) => { panel.inert = false; panel.removeAttribute("aria-hidden"); });
      };
    });
    return () => mm.revert();
  }, { scope: rootRef });

  return (
    <section id="experience" ref={rootRef} className="experience-journey relative scroll-mt-24">
      <div ref={frameRef} className="journey-frame">
        <div className="journey-inner">
          <header className="journey-header">
            <div>
              <p className="journey-kicker"><T en="CAREER JOURNEY / 2021 — PRESENT" id="PERJALANAN KARIER / 2021 — SEKARANG" /></p>
              <h2><T en="Experiences" id="Pengalaman" /></h2>
            </div>
            <a className="journey-skip" href="#projects"><T en="Explore projects" id="Jelajahi proyek" /><ArrowDown size={14} /></a>
          </header>
          <div className="journey-body">
            <div className="journey-chapters">
              {chapters.map(({ job, role }) => (
                <article className="journey-chapter" key={role.slug} id={`experience-${role.slug}`}>
                  <div className="journey-company">
                    <span className="journey-company-dot" /><span>{job.company}</span>
                    {job.current && <span className="journey-current"><T en="CURRENT" id="SAAT INI" /></span>}
                  </div>
                  <p className="journey-period"><T en={job.period.en} id={job.period.id} /> · <T en={job.location.en} id={job.location.id} /></p>
                  <h3 className="journey-title"><T en={role.title.en} id={role.title.id} /></h3>
                  {/* Photos live in the Documentation section now; the orbit's
                      floating field notes still draw from role.photos. */}
                  <ul className="journey-points">{role.points.map((point, i) => <li key={i}><T en={point.en} id={point.id} /></li>)}</ul>
                </article>
              ))}
            </div>
            <div className="journey-visual" aria-hidden="true">
              <KnowledgeOrbit roles={orbitRoles} activeSlug={chapter.role.slug} photos={chapter.role.photos} companies={jobs} activeCompany={chapter.companyIndex} />
            </div>
          </div>
          <footer className="journey-controls">
            <div className="journey-position"><span>{String(active + 1).padStart(2, "0")}</span> / {String(chapters.length).padStart(2, "0")}<span className="journey-scroll-hint"><T en="Scroll to unfold" id="Scroll untuk menjelajahi" /></span></div>
            <nav className="journey-stops" aria-label="Experience chapters">{chapters.map(({ role }, i) => <button key={role.slug} type="button" onClick={() => goTo(i)} aria-current={i === active ? "step" : undefined} aria-label={`${i + 1}. ${role.title.en}`}><span /></button>)}</nav>
            <div className="journey-actions">
              <button type="button" onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0} aria-label="Previous chapter / Peran sebelumnya"><ArrowLeft size={17} /></button>
              <button type="button" onClick={() => goTo(Math.min(chapters.length - 1, active + 1))} disabled={active === chapters.length - 1} aria-label="Next chapter / Peran berikutnya"><ArrowRight size={17} /></button>
            </div>
          </footer>
          <div className="journey-progress" aria-hidden="true"><div className="journey-progress-fill" /></div>
        </div>
      </div>
    </section>
  );
}
