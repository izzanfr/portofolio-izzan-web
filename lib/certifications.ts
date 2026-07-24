import credentials from "@/content/certifications.json";
import credentialsId from "@/content/certifications.id.json";
import type { BiText } from "@/lib/i18n";

/**
 * Certifications are bilingual. The English file is the structural source
 * (name, issuer, image, featured stay language-neutral); the Indonesian file
 * mirrors the translatable text — date, description, covers — position for
 * position, and is merged here into `{ en, id }` pairs the cards dual-render.
 */
export type Certificate = {
  name: string;
  issuer: string;
  image: string;
  featured: boolean;
  date: BiText;
  description: BiText;
  covers: BiText[];
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
      date: bi(cert.date, id.date),
      description: bi(cert.description, id.description),
      covers: cert.covers.map((cover, i) => bi(cover, idCovers[i])),
    };
  });
}
