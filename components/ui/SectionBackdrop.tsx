import { cn } from "@/lib/utils";

/**
 * Ambient section backdrop: two organic gradient washes — one warm, one cool —
 * drifting slowly behind the content. Decoration only: aria-hidden, low opacity,
 * sitting under everything. The parent section must be `relative` (and its
 * content wrapper too) so the backdrop stays underneath without a stacking
 * context.
 *
 * `index` cycles the placement table, so consecutive sections never land the
 * same composition and the page does not read as one repeated template.
 */

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

export function SectionBackdrop({
  index = 0,
  animated = true,
  className,
}: {
  /** Position of the section on the page — cycles the placement table. */
  index?: number;
  /** Slow drift on the mesh blobs. */
  animated?: boolean;
  className?: string;
}) {
  const layout =
    MESH_LAYOUTS[((index % MESH_LAYOUTS.length) + MESH_LAYOUTS.length) % MESH_LAYOUTS.length];

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className={cn("absolute h-[34rem] w-[44rem] rounded-full", animated && "wash-drift-a")}
        style={{ ...layout.warm, backgroundImage: WARM_WASH }}
      />
      <div
        className={cn("absolute h-[38rem] w-[40rem] rounded-full", animated && "wash-drift-b")}
        style={{ ...layout.cool, backgroundImage: COOL_WASH }}
      />
    </div>
  );
}

/**
 * Soft seam at a section's top edge — a faint downward-fading band. It replaces
 * a hard 1px rule, which read as a cut line over the drifting wash.
 */
export function SectionSeam({ className }: { className?: string }) {
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
