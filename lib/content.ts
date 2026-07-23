import profileJson from "@/content/profile.json";

export type Profile = typeof profileJson;

/** Single entry point for site-wide profile copy, so components never hardcode it. */
export const profile: Profile = profileJson;

export const navLinks = [
  { href: "/#about", id: "about", label: "About" },
  { href: "/#experience", id: "experience", label: "Experience" },
  { href: "/#projects", id: "projects", label: "Projects" },
  { href: "/#credentials", id: "credentials", label: "Credentials" },
  { href: "/#contact", id: "contact", label: "Contact" },
] as const;

/** Stable array identity — the scroll-spy observer keys off this. */
export const sectionIds = navLinks.map((link) => link.id);
