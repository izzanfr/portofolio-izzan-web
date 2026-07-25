"use client";

import { ViewTransition } from "react";
import { usePathname } from "next/navigation";

/**
 * Page transitions.
 *
 * A template (rather than the layout) so the page subtree is torn down and
 * rebuilt on navigation, which is what gives <ViewTransition> something to
 * animate out of and into.
 *
 * The explicit `key` matters: Next keys a root template by its *first* segment
 * only, so /projects/a → /projects/b would not remount it and a project-to-
 * project move would play no animation. Keying on the full pathname makes every
 * route change — home → project, project → project, project → home — a mount
 * and unmount pair.
 *
 * Direction comes from the `transitionTypes` each <Link> carries (see the
 * project cards, "Next project", and the back links). `default: "none"` keeps
 * the first paint and any untagged navigation from animating, so the page never
 * slides in on a cold load.
 *
 * This is a client component only to read the pathname; `children` stays a
 * server-rendered subtree passed straight through, so nothing extra ships.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ViewTransition
      key={pathname}
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
