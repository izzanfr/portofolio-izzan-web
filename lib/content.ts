import profileJson from "@/content/profile.json";
import profileIdJson from "@/content/profile.id.json";

export type Profile = typeof profileJson;

/**
 * Site-wide profile copy. `profile` is the English source (also used for
 * language-neutral fields — email, links, image paths — and for server-only SEO
 * metadata); `profileId` carries the Indonesian translations of the fields that
 * change. Components pair them through <T> so both render and CSS shows one.
 */
export const profile: Profile = profileJson;
export const profileId = profileIdJson;

/**
 * `tone` is the accent each link wears while it is the active section. They come
 * from the shared --role-* palette (see globals.css), which is already tuned to
 * hold its contrast in both themes — so the navbar picks up four distinct
 * colours without introducing a fifth set of values to keep in sync.
 *
 * `label` carries both languages so the nav dual-renders like everything else.
 */
export const navLinks = [
  {
    href: "/#experience",
    id: "experience",
    label: { en: "Experience", id: "Pengalaman" },
    tone: "--role-2",
  },
  {
    href: "/#projects",
    id: "projects",
    label: { en: "Projects", id: "Proyek" },
    tone: "--role-1",
  },
  {
    href: "/#credentials",
    id: "credentials",
    // Matches the section's own heading. The anchor stays `#credentials`:
    // the label is what a visitor reads, the id is what their bookmarks and
    // any shared links already point at.
    label: { en: "Certifications", id: "Sertifikasi" },
    tone: "--role-4",
  },
  {
    href: "/#contact",
    id: "contact",
    label: { en: "Contact", id: "Kontak" },
    tone: "--role-3",
  },
] as const;

/** Stable array identity — the scroll-spy observer keys off this. */
export const sectionIds = navLinks.map((link) => link.id);
