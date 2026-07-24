import { Section } from "@/components/ui/Section";
import { CertificateCards } from "@/components/ui/CertificateCards";
import { T } from "@/components/ui/T";
import { getCertificates } from "@/lib/certifications";

export function Certifications() {
  return (
    <Section
      id="credentials"
      title={<T en="Certifications" id="Sertifikasi" />}
      tone="tint"
      index={3}
    >
      <CertificateCards certificates={getCertificates()} />
    </Section>
  );
}
