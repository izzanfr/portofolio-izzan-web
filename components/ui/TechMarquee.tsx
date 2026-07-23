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

type Tool = { name: string; Icon: IconType; color: string };

/**
 * Brand colours are hardcoded rather than themed: a logo in the wrong colour
 * stops reading as that logo. Everything around them stays on the site palette.
 *
 * Power BI and Microsoft Project are absent on purpose. Simple Icons dropped
 * the Microsoft marks over trademark policy and no other react-icons set
 * carries them, and a generic bar-chart stand-in would misrepresent the brand.
 */
const ANALYSIS: Tool[] = [
  { name: "Excel", Icon: PiMicrosoftExcelLogoFill, color: "#217346" },
  { name: "Tableau", Icon: IoLogoTableau, color: "#E97627" },
  { name: "Google Colab", Icon: SiGooglecolab, color: "#F9AB00" },
  { name: "Jupyter", Icon: SiJupyter, color: "#F37626" },
];

const ENGINEERING: Tool[] = [
  { name: "Python", Icon: SiPython, color: "#3776AB" },
  { name: "PySpark", Icon: SiApachespark, color: "#E25A1C" },
  { name: "Hadoop", Icon: SiApachehadoop, color: "#66CCFF" },
  { name: "n8n", Icon: SiN8N, color: "#EA4B71" },
];

/**
 * Four rows' worth of duplication. Two would be enough for a seamless loop, but
 * a four-tool strip doubled is still narrower than a desktop viewport, which
 * would leave a visible gap mid-cycle. The keyframes shift by 25%, exactly one
 * copy, so the loop point stays invisible.
 */
const COPIES = 4;

function ToolStrip({ tools, hidden }: { tools: Tool[]; hidden: boolean }) {
  return (
    <ul className="flex shrink-0" aria-hidden={hidden || undefined}>
      {tools.map((tool) => (
        <li key={tool.name} className="me-3 shrink-0">
          <span className="flex items-center gap-2.5 rounded-full border border-border bg-surface px-5 py-3">
            <tool.Icon size={18} style={{ color: tool.color }} aria-hidden />
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
      <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-muted">Tech skills</h3>
      <div className="flex flex-col gap-4">
        <MarqueeRow tools={ANALYSIS} />
        <MarqueeRow tools={ENGINEERING} reverse />
      </div>
    </div>
  );
}
