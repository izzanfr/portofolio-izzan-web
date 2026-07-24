import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectCarousel } from "@/components/ui/ProjectCarousel";
import { getProjectMeta } from "@/lib/projects";

export function Projects() {
  const projects = getProjectMeta();

  return (
    <Section id="projects" title="Projects" tone="base" index={2}>
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
