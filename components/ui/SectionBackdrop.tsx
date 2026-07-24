import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Ambient section backdrops.
 *
 * Every layer here is decoration only: it sits behind the content, never above
 * ~12% opacity, and carries `aria-hidden`. The parent section must be
 * `relative`, and its content wrapper `relative` too, so the backdrop stays
 * underneath without needing a stacking context.
 *
 * Three treatments, one per candidate direction:
 *   mesh    — organic two-point gradient wash, optionally drifting
 *   grid    — dot/line ruling under a masked fade, plus one corner glow
 *   horizon — a single wide elliptical glow hugging one edge
 *
 * `index` cycles the placement tables, so consecutive sections never land the
 * same composition and the page does not read as one repeated template.
 */
export type BackdropVariant = "mesh" | "grid" | "horizon";

/* closest-side keeps the falloff tied to the element box, so resizing the blob
   rescales the whole gradient instead of cropping a fixed-radius one. */
const WARM_WASH =
  "radial-gradient(closest-side, color-mix(in srgb, var(--wash-warm) var(--wash-warm-strength), transparent), transparent)";
const COOL_WASH =
  "radial-gradient(closest-side, color-mix(in srgb, var(--wash-cool) var(--wash-cool-strength), transparent), transparent)";

type Point = { left: string; top: string };

/* Five entries, not four: the homepage runs to five sections, and a table that
   divided evenly into it would have put the same composition on the first and
   last screens. */
const MESH_LAYOUTS: { warm: Point; cool: Point }[] = [
  { warm: { left: "-18%", top: "-34%" }, cool: { left: "56%", top: "40%" } },
  { warm: { left: "60%", top: "-28%" }, cool: { left: "-24%", top: "34%" } },
  { warm: { left: "18%", top: "46%" }, cool: { left: "62%", top: "-36%" } },
  { warm: { left: "-20%", top: "16%" }, cool: { left: "46%", top: "48%" } },
  { warm: { left: "44%", top: "-40%" }, cool: { left: "-16%", top: "-10%" } },
];

const GRID_LAYOUTS: {
  ruling: "dot-grid" | "line-grid";
  mask: string;
  glow: Point;
  tone: "warm" | "cool";
}[] = [
  {
    ruling: "dot-grid",
    mask: "62% 58% at 22% 12%",
    glow: { left: "58%", top: "-26%" },
    tone: "warm",
  },
  {
    ruling: "line-grid",
    mask: "58% 62% at 82% 24%",
    glow: { left: "-20%", top: "26%" },
    tone: "cool",
  },
  {
    ruling: "dot-grid",
    mask: "66% 54% at 50% 92%",
    glow: { left: "64%", top: "34%" },
    tone: "cool",
  },
  {
    ruling: "line-grid",
    mask: "56% 60% at 14% 70%",
    glow: { left: "34%", top: "-30%" },
    tone: "warm",
  },
];

const HORIZON_LAYOUTS: { shape: string; tone: "warm" | "cool" }[] = [
  { shape: "78% 46% at 50% 0%", tone: "warm" },
  { shape: "70% 44% at 18% 100%", tone: "cool" },
  { shape: "72% 42% at 82% 0%", tone: "cool" },
  { shape: "80% 48% at 40% 100%", tone: "warm" },
];

/** Wash colour for a `radial-gradient(<shape>, …)` band rather than a blob. */
function bandWash(shape: string, tone: "warm" | "cool") {
  const colour =
    tone === "warm"
      ? "color-mix(in srgb, var(--wash-warm) var(--wash-warm-strength), transparent)"
      : "color-mix(in srgb, var(--wash-cool) var(--wash-cool-strength), transparent)";
  return `radial-gradient(${shape}, ${colour}, transparent 72%)`;
}

type SectionBackdropProps = {
  variant: BackdropVariant;
  /** Position of the section on the page — cycles the placement tables. */
  index?: number;
  /** Slow drift on the mesh blobs. Ignored by the other variants. */
  animated?: boolean;
  className?: string;
};

export function SectionBackdrop({
  variant,
  index = 0,
  animated = true,
  className,
}: SectionBackdropProps) {
  // Each table sets its own cycle length, so `index` is wrapped per variant
  // rather than against one shared modulus.
  const pick = <T,>(table: T[]) => table[((index % table.length) + table.length) % table.length];

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {variant === "mesh" && <MeshLayers layout={pick(MESH_LAYOUTS)} animated={animated} />}
      {variant === "grid" && <GridLayers layout={pick(GRID_LAYOUTS)} />}
      {variant === "horizon" && <HorizonLayer layout={pick(HORIZON_LAYOUTS)} />}
    </div>
  );
}

function MeshLayers({
  layout,
  animated,
}: {
  layout: (typeof MESH_LAYOUTS)[number];
  animated: boolean;
}) {

  return (
    <>
      <div
        className={cn(
          "absolute h-[34rem] w-[44rem] rounded-full",
          animated && "wash-drift-a",
        )}
        style={{ ...layout.warm, backgroundImage: WARM_WASH }}
      />
      <div
        className={cn(
          "absolute h-[38rem] w-[40rem] rounded-full",
          animated && "wash-drift-b",
        )}
        style={{ ...layout.cool, backgroundImage: COOL_WASH }}
      />
    </>
  );
}

function GridLayers({ layout }: { layout: (typeof GRID_LAYOUTS)[number] }) {
  // Both prefixes: Safari still needs -webkit-mask-image for gradient masks.
  const mask = `radial-gradient(${layout.mask}, black, transparent)`;
  const maskStyle: CSSProperties = { maskImage: mask, WebkitMaskImage: mask };

  return (
    <>
      <div
        className={cn(
          "absolute inset-0",
          layout.ruling,
          layout.ruling === "dot-grid" ? "opacity-45" : "opacity-40",
        )}
        style={maskStyle}
      />
      <div
        className="absolute h-[32rem] w-[38rem] rounded-full"
        style={{
          ...layout.glow,
          backgroundImage: layout.tone === "warm" ? WARM_WASH : COOL_WASH,
        }}
      />
    </>
  );
}

function HorizonLayer({ layout }: { layout: (typeof HORIZON_LAYOUTS)[number] }) {
  return (
    <div
      className="absolute inset-0"
      style={{ backgroundImage: bandWash(layout.shape, layout.tone) }}
    />
  );
}

/* ---------------------------------------------------------------
   Section seams

   The default hairline is a 1px gradient rule. `fade` swells it into a soft
   band, `wave` replaces it with a curve cut in the section's own colour —
   drawn above the section's top edge, so it eats into the previous one.
--------------------------------------------------------------- */
export type SeamKind = "hairline" | "fade" | "wave";

type SectionSeamProps = {
  kind?: SeamKind;
  /** Which surface the seam is cut from — matches the section's own tone. */
  tone?: "base" | "tint";
  /** `rise` bulges the curve upward, `dip` sinks it. */
  curve?: "rise" | "dip";
  className?: string;
};

const RISE = "M0,72 C360,4 1080,4 1440,72 L1440,72 L0,72 Z";
const DIP = "M0,0 C360,68 1080,68 1440,0 L1440,72 L0,72 Z";

export function SectionSeam({
  kind = "hairline",
  tone = "base",
  curve = "rise",
  className,
}: SectionSeamProps) {
  if (kind === "wave") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-8 w-full -translate-y-full md:h-14",
          className,
        )}
        style={{ fill: tone === "tint" ? "var(--tint)" : "var(--background)" }}
      >
        <path d={curve === "rise" ? RISE : DIP} />
      </svg>
    );
  }

  if (kind === "fade") {
    return (
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[color-mix(in_srgb,var(--foreground)_7%,transparent)] to-transparent",
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent",
        className,
      )}
    />
  );
}
