import profileJson from "@/content/profile.json";

export type Profile = typeof profileJson;

/** Single entry point for site-wide profile copy, so components never hardcode it. */
export const profile: Profile = profileJson;

/**
 * `tone` is the accent each link wears while it is the active section. They come
 * from the shared --role-* palette (see globals.css), which is already tuned to
 * hold its contrast in both themes — so the navbar picks up four distinct
 * colours without introducing a fifth set of values to keep in sync.
 */
export const navLinks = [
  { href: "/#experience", id: "experience", label: "Experience", tone: "--role-2" },
  { href: "/#projects", id: "projects", label: "Projects", tone: "--role-1" },
  { href: "/#credentials", id: "credentials", label: "Credentials", tone: "--role-4" },
  { href: "/#contact", id: "contact", label: "Contact", tone: "--role-3" },
] as const;

/** Stable array identity — the scroll-spy observer keys off this. */
export const sectionIds = navLinks.map((link) => link.id);
