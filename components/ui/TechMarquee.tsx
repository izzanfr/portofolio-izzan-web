import type { IconType } from "react-icons";
import { IoLogoTableau } from "react-icons/io5";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import {
  SiApachehadoop,
  SiApachespark,
  SiGooglecolab,
  SiJupyter,
  SiN8N,
  SiPython,
} from "react-icons/si";

/**
 * A tool is drawn either from a react-icons glyph (tinted to its brand colour)
 * or from a real SVG logo in /public/logos for brands react-icons doesn't carry
 * — Power BI and Microsoft Project, which Simple Icons dropped over trademark
 * policy. The logo files already carry their own colours, so no tint applies.
 */
type Tool =
  | { name: string; Icon: IconType; color: string }
  | { name: string; src: string };

const ANALYSIS: Tool[] = [
  { name: "Excel", Icon: PiMicrosoftExcelLogoFill, color: "#217346" },
  { name: "Power BI", src: "/logos/Power%20BI.svg" },
  { name: "Tableau", Icon: IoLogoTableau, color: "#E97627" },
  { name: "Google Colab", Icon: SiGooglecolab, color: "#F9AB00" },
  { name: "Jupyter", Icon: SiJupyter, color: "#F37626" },
];

const ENGINEERING: Tool[] = [
  { name: "Python", Icon: SiPython, color: "#3776AB" },
  { name: "PySpark", Icon: SiApachespark, color: "#E25A1C" },
  { name: "Hadoop", Icon: SiApachehadoop, color: "#66CCFF" },
  { name: "n8n", Icon: SiN8N, color: "#EA4B71" },
  { name: "Microsoft Project", src: "/logos/Microsoft%20Project.svg" },
];

/**
 * Enough copies that a doubled strip still overflows the widest viewport, or a
 * gap would show mid-cycle. The keyframes shift by one copy's width so the loop
 * point stays invisible; COPIES and that percentage must agree.
 */
const COPIES = 4;

function ToolMark({ tool }: { tool: Tool }) {
  if ("src" in tool) {
    // Plain img, not next/image: these are tiny inline SVGs that Next passes
    // through unoptimised anyway. height fixed, width auto keeps each logo's
    // own aspect ratio.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={tool.src} alt="" aria-hidden className="h-[18px] w-auto" />;
  }
  return <tool.Icon size={18} style={{ color: tool.color }} aria-hidden />;
}

function ToolStrip({ tools, hidden }: { tools: Tool[]; hidden: boolean }) {
  return (
    <ul className="flex shrink-0" aria-hidden={hidden || undefined}>
      {tools.map((tool) => (
        <li key={tool.name} className="me-3 shrink-0">
          <span className="flex items-center gap-2.5 rounded-full border border-border bg-surface px-5 py-3">
            <ToolMark tool={tool} />
            <span className="whitespace-nowrap text-sm font-medium">{tool.name}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function MarqueeRow({ tools, reverse }: { tools: Tool[]; reverse?: boolean }) {
  return (
    // overflow-hidden keeps the oversized track from widening the page, and the
    // mask fades both ends so pills enter and leave instead of being cut.
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      {/* Spacing via each item's margin rather than `gap` on the track: with
          `gap` the loop point lands half a gap out and the strip visibly jumps
          on repeat. */}
      <div className={`flex w-max ${reverse ? "marquee-rtl" : "marquee-ltr"}`}>
        {Array.from({ length: COPIES }, (_, copy) => (
          <ToolStrip key={copy} tools={tools} hidden={copy > 0} />
        ))}
      </div>
    </div>
  );
}

export function TechMarquee() {
  return (
    <div>
      {/* Centred and enlarged so the marquee reads as its own titled block
          rather than a caption trailing the stats above it. */}
      <h3 className="mb-7 text-center font-mono text-sm uppercase tracking-[0.32em] text-accent-strong dark:text-accent md:text-base">
        Tech skills
      </h3>
      <div className="flex flex-col gap-4">
        <MarqueeRow tools={ANALYSIS} />
        <MarqueeRow tools={ENGINEERING} reverse />
      </div>
    </div>
  );
}
