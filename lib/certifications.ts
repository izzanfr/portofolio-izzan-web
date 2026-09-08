import credentials from "@/content/certifications.json";
import credentialsId from "@/content/certifications.id.json";
import type { BiText } from "@/lib/i18n";

/**
 * Certifications are bilingual. The English file is the structural source
 * (name, issuer, image, featured stay language-neutral); the Indonesian file
 * mirrors the translatable text — date, description, covers — position for
 * position, and is merged here into `{ en, id }` pairs the cards dual-render.
 */
/**
 * Who awarded a credential, as opposed to what the credential is called.
 *
 * `issuer` on a certificate carries the exam code alongside the organisation
 * ("Microsoft (PL-300)", "Salesforce (Tableau)"), which is right on the
 * certificate itself and useless for grouping. This is the organisation on its
 * own, so the gallery can lead with the five bodies rather than with six
 * certificate scans at six different aspect ratios.
 */
export type Publisher = {
  /** Full organisation name. */
  name: string;
  /** What the tile shows when there is no logo file — usually the wordmark or
   *  the acronym everyone knows it by. */
  short: string;
  /** Optional path under /public. */
  logo?: string;
  /**
   * True when the file is a knockout — white ink on transparent, drawn for
   * dark grounds. Such a mark is invisible on the white plate the others need,
   * so its tile is dark instead. Measured rather than eyeballed: iTrain Asia's
   * file is 64% transparent and 18% near-white ink against 18% dark, and on
   * white only that dark fifth — the icon — was showing.
   */
  logoOnDark?: boolean;
  /**
   * True when the mark needs the whole plate rather than the shared inset.
   *
   * A very wide lockup is sized by the plate's width, so the standard padding
   * costs it height twice over — iTrain Asia's is 4.67:1, and at the shared
   * inset it drew at 307×66 in a 403px tile. Setting this trades the card's
   * parallax shift for that room: the margin the shift needs is exactly the
   * margin the mark wants, and on a logo this wide the size matters more than
   * the depth.
   */
  logoFill?: boolean;
};

export type Certificate = {
  name: string;
  issuer: string;
  image: string;
  featured: boolean;
  publisher: Publisher;
  date: BiText;
  description: BiText;
  covers: BiText[];
};

/** A publisher and everything held from it. */
export type PublisherGroup = Publisher & {
  certificates: Certificate[];
  /** True when any credential in the group is a flagship one. */
  featured: boolean;
};

type EnCert = (typeof credentials.certifications)[number];
type IdCert = { date?: string; description?: string; covers?: string[] };

const bi = (en: string, id: string | undefined): BiText => ({ en, id: id ?? en });

export function getCertificates(): Certificate[] {
  const idList = credentialsId.certifications as IdCert[];
  return (credentials.certifications as EnCert[]).map((cert, index) => {
    const id = idList[index] ?? {};
    const idCovers = id.covers ?? [];
    return {
      name: cert.name,
      issuer: cert.issuer,
      image: cert.image,
      featured: cert.featured,
      publisher: cert.publisher,
      date: bi(cert.date, id.date),
      description: bi(cert.description, id.description),
      covers: cert.covers.map((cover, i) => bi(cover, idCovers[i])),
    };
  });
}

/**
 * Certificates grouped under the body that awarded them, in the order the
 * certificates themselves are listed — so the flagship credentials keep the
 * front of the gallery without a second sort.
 */
export function getPublishers(): PublisherGroup[] {
  const groups = new Map<string, PublisherGroup>();

  for (const certificate of getCertificates()) {
    const existing = groups.get(certificate.publisher.name);
    if (existing) {
      existing.certificates.push(certificate);
      existing.featured ||= certificate.featured;
      continue;
    }
    groups.set(certificate.publisher.name, {
      ...certificate.publisher,
      certificates: [certificate],
      featured: certificate.featured,
    });
  }

  return [...groups.values()];
}
