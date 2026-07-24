import credentials from "@/content/certifications.json";

export type Certificate = {
  name: string;
  issuer: string;
  date: string;
  featured: boolean;
  image: string;
  description: string;
  covers: string[];
};

export function getCertificates(): Certificate[] {
  return credentials.certifications;
}
