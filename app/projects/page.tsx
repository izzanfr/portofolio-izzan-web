import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { T } from "@/components/ui/T";
import { getProjectMeta } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Consulting engagements across SPBE architecture, data management, information security, and AI strategy for Indonesian government institutions and state enterprises.",
};

export default function ProjectsIndexPage() {
  const projects = getProjectMeta();

  return (
    <div className="pb-24 pt-32 md:pt-40">
      <div className="container-page">
        <Reveal>
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent-strong dark:hover:text-accent"
          >
            <ArrowLeft
              size={15}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            <T en="Back home" id="Kembali ke beranda" />
          </Link>
          <h1 className="mt-8 text-balance text-4xl tracking-display md:text-5xl">
            <T en="Projects" id="Proyek" />
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
            <T
              en={`${projects.length} consulting engagements across provincial and regency governments, national agencies, and state enterprises.`}
              id={`${projects.length} penugasan konsultasi di lingkungan pemerintah provinsi dan kabupaten, lembaga nasional, serta badan usaha milik negara.`}
            />
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Reveal key={project.slug} delay={(index % 3) * 0.08} className="h-full">
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
