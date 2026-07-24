import { Section } from "@/components/ui/Section";
import { CertificateCards } from "@/components/ui/CertificateCards";
import { getCertificates } from "@/lib/certifications";

export function Certifications() {
  return (
    <Section id="credentials" title="Certifications" tone="tint" index={3}>
      <CertificateCards certificates={getCertificates()} />
    </Section>
  );
}
