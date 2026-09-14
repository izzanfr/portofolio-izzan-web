"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useRef, type PointerEvent } from "react";
import { profile } from "@/lib/content";

// Interaction inspired by React Bits Flowing Menu:
// https://reactbits.dev/components/flowing-menu
// Compact implementation with stationary brand assets and keyboard/touch support.
// Email leads: it is the one channel every visitor can use without an account.
const socials: { name: string; handle: string; href: string; logo: string }[] = [
  { name: "Email", handle: profile.email, href: `mailto:${profile.email}`, logo: "/logos/gmail.svg" },
  { name: "LinkedIn", handle: profile.linkedinLabel.replace(/^linkedin\.com/, ""), href: profile.linkedin, logo: "/logos/linkedin.png" },
  { name: "TikTok", handle: "@izzanfr", href: "https://www.tiktok.com/@izzanfr", logo: "/logos/tiktok.png" },
  { name: "Instagram", handle: "@izzanfr", href: "https://www.instagram.com/izzanfr", logo: "/logos/instagram.png" },
];

function SocialRow({ social }: { social: typeof socials[number] }) {
  const rowRef = useRef<HTMLAnchorElement>(null);
  const layerRef = useRef<HTMLSpanElement>(null);

  /**
   * A CSS transition, not a tween. The layer rests off the row at the edge in
   * `--flow-from`; `data-active` slides it to 0 and back out. GSAP was tried
   * and read the stylesheet's translateY(101%) as a fixed pixel offset that no
   * yPercent tween could remove, so the layer never rose and hovering only
   * blanked the row.
   */
  function reveal(show: boolean, edge = 1) {
    const row = rowRef.current;
    const layer = layerRef.current;
    if (!row || !layer) return;
    const from = `${edge * 101}%`;
    if (show && row.dataset.active !== "true") {
      // Move the resting layer to the entry edge without animating it, or it
      // would sweep across the row on its way from one edge to the other.
      layer.style.transition = "none";
      row.style.setProperty("--flow-from", from);
      void layer.offsetHeight;
      layer.style.transition = "";
    } else if (!show) {
      row.style.setProperty("--flow-from", from);
    }
    row.dataset.active = String(show);
  }

  function pointer(event: PointerEvent<HTMLAnchorElement>, entering: boolean) {
    if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (!entering && document.activeElement === event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    reveal(entering, event.clientY < rect.top + rect.height / 2 ? -1 : 1);
  }

  return (
    <a ref={rowRef} href={social.href}
      {...(social.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      className="social-flow-row" aria-label={`${social.name} ${social.handle}`}
      onPointerEnter={(event) => pointer(event, true)} onPointerLeave={(event) => pointer(event, false)}
      onFocus={() => reveal(true)} onBlur={() => reveal(false)}>
      <span className="social-flow-logo"><Image src={social.logo} width={30} height={30} alt="" unoptimized /></span>
      <span className="social-flow-copy"><span>{social.name}</span><small>{social.handle}</small></span>
      <span ref={layerRef} className="social-flow-layer" aria-hidden="true">
        <span className="social-flow-window">
          <span className="social-flow-ribbon">
            {[0, 1].map((copy) => <span className="social-flow-repeat" key={copy}>
              {[0, 1].map((beat) => <span className="social-flow-beat" key={beat}>
                <Image src={social.logo} width={26} height={26} alt="" unoptimized />
                <span>{social.name}</span><small>{social.handle}</small><i />
              </span>)}
            </span>)}
          </span>
        </span>
      </span>
      <ArrowUpRight className="social-flow-arrow" size={18} aria-hidden="true" />
    </a>
  );
}

export function SocialFlowMenu() {
  return <div className="social-flow-menu">{socials.map((social) => <SocialRow key={social.name} social={social} />)}</div>;
}
