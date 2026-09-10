import experienceEn from "@/content/experience.json";
import experienceId from "@/content/experience.id.json";
import type { BiText } from "@/lib/i18n";

/**
 * Experience content is bilingual. The English file (`experience.json`) is the
 * structural source of truth — it carries every language-neutral field (image
 * `src`, `icon`, `slug`, `current`) plus the English text. The Indonesian file
 * mirrors only the translatable text, position for position, and is merged onto
 * it here. Keeping image paths in one file is what stops the two drifting.
 *
 * The result pairs each translatable field as `{ en, id }` so the section can
 * dual-render through <T>. Missing Indonesian entries fall back to English.
 */

export type BiPhoto = { src: string; alt: BiText; caption?: BiText };

export type BiRole = {
  title: BiText;
  slug: string;
  icon: string;
  /**
   * Currently unread. It drove the category chips above a company's role list;
   * those went when Experience became two pinned stops, and every role in a
   * company now shows at once. Kept because the classification is real and
   * costs nothing to carry — a filter, a grouped rail or a badge would all
   * want it back — but nothing renders from it today, so a wrong value here
   * will not show up anywhere.
   */
  category?: string;
  points: BiText[];
  photos: BiPhoto[];
};

export type BiJob = {
  company: string;
  /** Official company logo in /public/logos, shown at the core of the orbit. */
  logo?: string;
  current: boolean;
  location: BiText;
  period: BiText;
  duration: BiText;
  summary: BiText;
  roles: BiRole[];
};

type EnJob = (typeof experienceEn)[number];
type EnRole = EnJob["roles"][number];
type EnPhoto = { src: string; alt: string; caption?: string };

type IdPhoto = { alt?: string; caption?: string };
type IdRole = { title?: string; points?: string[]; photos?: IdPhoto[] };
type IdJob = {
  location?: string;
  period?: string;
  duration?: string;
  summary?: string;
  roles?: IdRole[];
};

const bi = (en: string, id: string | undefined): BiText => ({ en, id: id ?? en });

function mergePhoto(en: EnPhoto, id: IdPhoto | undefined): BiPhoto {
  const caption = en.caption !== undefined ? bi(en.caption, id?.caption) : undefined;
  return {
    src: en.src,
    alt: bi(en.alt, id?.alt),
    caption,
  };
}

function mergeRole(en: EnRole, id: IdRole | undefined): BiRole {
  const idPhotos = id?.photos ?? [];
  const idPoints = id?.points ?? [];
  return {
    slug: en.slug,
    icon: en.icon,
    // Read defensively: only the roles that belong to a filtered company carry
    // a category, so it is absent from the inferred type of the others.
    category: (en as { category?: string }).category,
    title: bi(en.title, id?.title),
    points: en.points.map((point, i) => bi(point, idPoints[i])),
    photos: (en.photos as EnPhoto[]).map((photo, i) => mergePhoto(photo, idPhotos[i])),
  };
}

export function getExperience(): BiJob[] {
  return (experienceEn as EnJob[]).map((job, jobIndex) => {
    const id = (experienceId as IdJob[])[jobIndex] ?? {};
    const idRoles = id.roles ?? [];
    return {
      company: job.company,
      logo: (job as { logo?: string }).logo,
      current: job.current,
      location: bi(job.location, id.location),
      period: bi(job.period, id.period),
      duration: bi(job.duration, id.duration),
      summary: bi(job.summary, id.summary),
      roles: job.roles.map((role, i) => mergeRole(role, idRoles[i])),
    };
  });
}
