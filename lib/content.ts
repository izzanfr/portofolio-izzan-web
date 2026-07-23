import profileJson from "@/content/profile.json";

export type Profile = typeof profileJson;

/** Single entry point for site-wide profile copy, so components never hardcode it. */
export const profile: Profile = profileJson;

export const navLinks = [
  { href: "/#about", label: "About" },
  { href: "/#experience", label: "Experience" },
  { href: "/#skills", label: "Skills" },
  { href: "/#projects", label: "Projects" },
  { href: "/#credentials", label: "Credentials" },
  { href: "/#contact", label: "Contact" },
] as const;
