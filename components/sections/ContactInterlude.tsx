"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "framer-motion";
import { MaskedHeading } from "@/components/ui/MaskedHeading";
import { Aurora } from "@/components/ui/Aurora";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { pick } from "@/lib/i18n";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// The photo seen through the letters: the largest room in the documentation.
const HEADING_PHOTO = "/experience/data-science-instructor/Data Analytic with Excel & PowerBI with GenBI.jpeg";

// Brand gold, and the teal and rose from the site's role palette.
const AURORA: [string, string, string] = ["#dda968", "#5eccc0", "#f0a0ac"];

// Scroll timeline, as fractions of the pinned stretch.
const CURTAIN_END = 0.34; // the curtain has covered the screen
const SHOW_AT = 0.3; // the heading starts rising, just before the curtain lands
const HIDE_BELOW = 0.2; // scrolling back this far sinks it again

/**
 * The scene between Documentation and Contact, which makes Contact a page of
 * its own rather than the next block down.
 *
 * It opens on the page colour Documentation ends on, so the join is invisible.
 * As you scroll, the screen holds and a curtain carrying an aurora rises from
 * below; once it lands, "Ready for What's Next?" rises into the letters.
 * Scrolling on, the stage lets go and Contact follows on the same colour — the
 * whole scene stays on the one light ground, and the change of mood comes
 * from the light, not from a change of background.
 *
 * Under reduced motion there is no hold and no curtain: a plain band in the
 * page colour with the heading already in place.
 */
export function ContactInterlude() {
  const rootRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const locale = useCurrentLocale();

  useGSAP(
    () => {
      const root = rootRef.current;
      const curtain = curtainRef.current;
      const heading = headingRef.current;
      if (reduced || !root || !curtain || !heading) return;

      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          // Played, not scrubbed: the words rise on their own clock once the
          // curtain is nearly down, and sink if the visitor backs out.
          onUpdate: (self) => {
            if (self.progress >= SHOW_AT) setShown(true);
            else if (self.progress < HIDE_BELOW) setShown(false);
          },
        },
      });
      // Transform rather than clip-path: a full-screen layer moving on the
      // compositor, which keeps the scrub smooth.
      timeline.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, ease: "power2.inOut", duration: CURTAIN_END }, 0);
      // Held, then the heading eases upward as the stage prepares to let go.
      // Snapped to whole pixels: at fractional offsets the text clip-path
      // leaked hairlines of the photo along the heading's edges.
      timeline.fromTo(
        heading,
        { y: 0 },
        { y: () => Math.round(-window.innerHeight * 0.06), snap: { y: 1 }, duration: 1 - 0.8 },
        0.8,
      );
    },
    { scope: rootRef, dependencies: [reduced] },
  );

  const text = pick({ en: "Ready for What's Next?", id: "Siap untuk Langkah Berikutnya?" }, locale);

  if (reduced) {
    return (
      <div className="contact-interlude contact-interlude--static">
        <Aurora colorStops={AURORA} amplitude={1.1} blend={0.6} />
        <div className="contact-interlude__heading">
          <MaskedHeading text={text} src={HEADING_PHOTO} shown brightness={0.82} saturation={1.1} />
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="contact-interlude">
      {/* Hides the navbar while this holds the screen (see Navbar). */}
      <div className="contact-interlude__stage" data-nav-hide>
        {/* The curtain brings its own weather: an aurora across its upper
            half, in the site's gold, teal and rose, so the scene reads as a
            different place from the navy it rises over. */}
        <div ref={curtainRef} className="contact-interlude__curtain" aria-hidden="true">
          <Aurora colorStops={AURORA} amplitude={1.1} blend={0.6} speed={0.8} />
        </div>
        <div ref={headingRef} className="contact-interlude__heading">
          <MaskedHeading text={text} src={HEADING_PHOTO} shown={shown} brightness={0.82} saturation={1.1} />
        </div>
      </div>
    </div>
  );
}
