import type { SVGProps } from "react";

/**
 * lucide-react v1 dropped brand marks, so the LinkedIn glyph lives here.
 * Sized and stroked to sit alongside lucide icons without looking foreign.
 */
export function LinkedInIcon({ size = 16, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.71h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.7c0-1.36-.03-3.1-2-3.1-2 0-2.31 1.47-2.31 3v5.8h-4V9Z" />
    </svg>
  );
}

/**
 * Flag chips for the language menu.
 *
 * Drawn rather than written as emoji: emoji flags do not render on Windows at
 * all — Chrome there falls back to the bare two-letter code — and that is a
 * large share of this site's audience.
 *
 * Deliberately simplified. The Union Jack's real construction offsets the red
 * diagonals to one side of the white ones; at 20px that is invisible and costs
 * four more paths, so the diagonals here are centred. The svg root clips to its
 * viewBox by default, which is what keeps the diagonal stroke ends square with
 * the corners.
 *
 * A flag names a country and these name languages, which is not the same thing —
 * so they stay decoration. Every option in the menu carries its language's own
 * name beside the chip, and that is what actually identifies it.
 */
function FlagFrame({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 16" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

/** English. */
export function FlagGB(props: SVGProps<SVGSVGElement>) {
  return (
    <FlagFrame {...props}>
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#FFFFFF" strokeWidth="3.4" />
      <path d="M0 0 24 16M24 0 0 16" stroke="#C8102E" strokeWidth="1.9" />
      <path d="M12 0v16M0 8h24" stroke="#FFFFFF" strokeWidth="5.6" />
      <path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="3.4" />
    </FlagFrame>
  );
}

/** Bahasa Indonesia. */
export function FlagID(props: SVGProps<SVGSVGElement>) {
  return (
    <FlagFrame {...props}>
      <rect width="24" height="8" fill="#CE1126" />
      <rect y="8" width="24" height="8" fill="#F7F7F7" />
    </FlagFrame>
  );
}
