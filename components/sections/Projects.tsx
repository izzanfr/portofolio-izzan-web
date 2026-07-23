import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectCarousel } from "@/components/ui/ProjectCarousel";
import { getProjectMeta } from "@/lib/projects";

export function Projects() {
  const projects = getProjectMeta();

  return (
    <Section
      id="projects"
      eyebrow="Projects"
      title="Consulting engagements, documented."
      lead="Nine engagements across provincial and regency governments, national agencies, and state enterprises, covering SPBE architecture, data management, information security, and AI strategy."
      tone="base"
    >
      <Reveal>
        <ProjectCarousel projects={projects} />
      </Reveal>

      <Reveal delay={0.1}>
        <Link
          href="/projects"
          className="group mt-10 inline-flex items-center gap-2 text-sm font-medium text-accent-strong dark:text-accent"
        >
          View all {projects.length} projects
          <ArrowRight
            size={15}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </Reveal>
    </Section>
  );
}
