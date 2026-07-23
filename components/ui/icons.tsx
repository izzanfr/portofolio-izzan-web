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
