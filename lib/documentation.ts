import { getExperience, type BiPhoto } from "@/lib/experience";
import type { BiText } from "@/lib/i18n";

/**
 * The Documentation section is built from the photos already listed under each
 * role in `experience.json` — there is no second list to keep in step. Adding a
 * photo to a role puts it on the wall; the role title rides along so the viewer
 * can say which engagement a picture came from.
 */

export type DocumentationPhoto = BiPhoto & {
  /** Title of the role the photo was filed under, shown as its context line. */
  role: BiText;
  roleSlug: string;
};

const photos: DocumentationPhoto[] = getExperience().flatMap((job) =>
  job.roles.flatMap((role) =>
    role.photos.map((photo) => ({ ...photo, role: role.title, roleSlug: role.slug })),
  ),
);

/** Every documented photo, newest role first — the order experience.json keeps. */
export function getDocumentationPhotos(): DocumentationPhoto[] {
  return photos;
}

/**
 * The accordion's panels: the lead photo of each role, so every kind of work
 * gets one slot rather than the busiest role taking all of them. To promote a
 * different shot, move it to the top of that role's `photos` list.
 */
export function getDocumentationHighlights(): DocumentationPhoto[] {
  const seen = new Set<string>();
  return photos.filter((photo) => {
    if (seen.has(photo.roleSlug)) return false;
    seen.add(photo.roleSlug);
    return true;
  });
}
