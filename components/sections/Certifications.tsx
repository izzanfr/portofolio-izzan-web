"use client";

import { Section } from "@/components/ui/Section";
import { CertificateCards } from "@/components/ui/CertificateCards";
import credentials from "@/content/certifications.json";

export function Certifications() {
  return (
    <Section id="credentials" eyebrow="Credentials" title="Certifications." tone="tint">
      <CertificateCards certificates={credentials.certifications} />
    </Section>
  );
}
