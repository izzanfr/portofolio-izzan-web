"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { T } from "@/components/ui/T";
import { cn } from "@/lib/utils";
import { profile } from "@/lib/content";
import { EASE } from "@/lib/motion";

const SIZES = "(max-width: 640px) 15rem, (max-width: 1024px) 17rem, 27rem";

/** Seconds for the tilt to close ~63% of the gap to its target — the same
 *  damping React Bits' Profile Card uses, which is what makes it feel weighty
 *  rather than twitchy. */
const TAU = 0.14;
/** Degrees at the card's edges. */
const MAX_TILT = 9;
/** How far a phone's lean moves the light, in percent per degree. */
const DEVICE_SENSITIVITY = 1.6;

/**
 * Hero portrait as a profile card, after React Bits' Profile Card
 * (https://reactbits.dev/components/profile-card): the card tilts toward the
 * pointer, a light follows it across the photo, a warm glow shifts behind it,
 * and a frosted bar carries the name and a way to get in touch.
 *
 * Deliberately not its holographic finish. The original's rainbow color-dodge
 * foil is the one element that would read as a template on a navy-and-gold
 * site, so the light here is plain white and the glow is the accent gold.
 *
 * The flip to the public-speaking photo is kept. It is a real 3D turn inside a
 * static rounded clip (a rotated clip leaves a light fringe on one edge), with
 * perspective on its own layer so it never shares an element with the clip.
 *
 * Tilt is written as CSS variables from one rAF loop that stops once the card
 * settles, so an idle hero costs nothing. Phones tilt from the device's lean;
 * iOS only reports it after a permission asked from a tap, so that is requested
 * on the first touch of the card.
 */
function Face({ src, alt, priority, className }: { src: string; alt: string; priority?: boolean; className?: string }) {
  return (
    <div className={cn("absolute inset-0 [backface-visibility:hidden]", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={SIZES}
        priority={priority}
        unoptimized={src.endsWith(".svg")}
        className="pcard-img object-cover object-center"
      />
    </div>
  );
}

export function HeroPortrait() {
  const [flipped, setFlipped] = useState(false);
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced) return;

    const target = { x: 50, y: 50, active: 0 };
    const current = { ...target };
    let frame = 0;
    let last = 0;

    const paint = () => {
      stage.style.setProperty("--px", `${current.x.toFixed(2)}%`);
      stage.style.setProperty("--py", `${current.y.toFixed(2)}%`);
      stage.style.setProperty("--rx", `${(((50 - current.y) / 50) * MAX_TILT).toFixed(2)}deg`);
      stage.style.setProperty("--ry", `${(((current.x - 50) / 50) * MAX_TILT).toFixed(2)}deg`);
      stage.style.setProperty("--active", current.active.toFixed(3));
    };

    const tick = (now: number) => {
      // Clamped so one long frame cannot snap the card across in a single paint.
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const k = 1 - Math.exp(-dt / TAU);
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
      current.active += (target.active - current.active) * k;
      paint();
      const gap = Math.abs(target.x - current.x) + Math.abs(target.y - current.y) + Math.abs(target.active - current.active) * 100;
      if (gap > 0.05) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
        last = 0;
      }
    };

    const aim = (x: number, y: number, active: number) => {
      target.x = Math.max(0, Math.min(100, x));
      target.y = Math.max(0, Math.min(100, y));
      target.active = active;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = stage.getBoundingClientRect();
      aim(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100, 1);
    };
    const onLeave = () => aim(50, 50, 0);

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma == null || event.beta == null) return;
      // A phone held to read sits around 40° forward; that is "level" here.
      aim(50 + event.gamma * DEVICE_SENSITIVITY, 50 + (event.beta - 40) * DEVICE_SENSITIVITY, 1);
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const Orientation = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    let askPermission: (() => void) | null = null;
    if (coarse && Orientation) {
      if (typeof Orientation.requestPermission === "function") {
        askPermission = () => {
          Orientation.requestPermission!()
            .then((state) => {
              if (state === "granted") window.addEventListener("deviceorientation", onOrientation);
            })
            .catch(() => {});
        };
        stage.addEventListener("click", askPermission, { once: true });
      } else {
        window.addEventListener("deviceorientation", onOrientation);
      }
    }

    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      if (askPermission) stage.removeEventListener("click", askPermission);
      window.removeEventListener("deviceorientation", onOrientation);
      for (const name of ["--px", "--py", "--rx", "--ry", "--active"]) stage.style.removeProperty(name);
    };
  }, [reduced]);

  return (
    <div ref={stageRef} className="pcard-stage relative w-full">
      {/* The warm glow behind the card. It follows the light, so the card
          seems to be lit from where the pointer is. */}
      <div aria-hidden className="pcard-behind pointer-events-none absolute -z-10" />

      <div className="pcard relative">
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          aria-pressed={flipped}
          aria-label={flipped ? "Show profile photo" : "Flip to public speaking photo"}
          className="pcard-face relative block w-full"
        >
          {/* Static rounded clip — never rotated, so its edge stays clean. */}
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-surface">
            <div className="absolute inset-0 [perspective:1200px]">
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative h-full w-full"
              >
                <Face src={profile.avatar} alt={profile.name} priority />
                <Face
                  src={profile.avatarBack}
                  alt={`${profile.name} speaking to an audience`}
                  className="[transform:rotateY(180deg)]"
                />
              </motion.div>
            </div>
          </div>
        </button>

        {/* Two layers because they blend differently: the shade dims the photo
            outside the spotlight (normal blend), the glare lights the spot
            itself (soft-light). Both ignore the pointer so the flip button
            underneath still takes the click. */}
        <div aria-hidden className="pcard-shade pointer-events-none absolute inset-0 rounded-card" />
        <div aria-hidden className="pcard-glare pointer-events-none absolute inset-0 rounded-card" />

        <div className="pcard-info absolute">
          <span className="pcard-info-avatar">
            <Image src={profile.avatar} width={40} height={40} alt="" />
          </span>
          <span className="pcard-info-text">
            <strong>{profile.shortName}</strong>
            <small>
              <T en="IT Consultant · AI Instructor" id="Konsultan TI · Instruktur AI" />
            </small>
          </span>
          <a href="#contact" className="pcard-info-cta">
            <T en="Contact" id="Kontak" />
            <ArrowUpRight size={14} strokeWidth={2.2} aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
