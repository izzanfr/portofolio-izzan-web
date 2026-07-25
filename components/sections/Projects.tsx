import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectCoverflow } from "@/components/ui/ProjectCoverflow";
import { T } from "@/components/ui/T";
import { getProjectMeta } from "@/lib/projects";

export function Projects() {
  const projects = getProjectMeta();

  return (
    <Section id="projects" title={<T en="Projects" id="Proyek" />} tone="base" index={2}>
      <Reveal>
        <ProjectCoverflow projects={projects} />
      </Reveal>

      <Reveal delay={0.1}>
        <Link
          href="/projects"
          transitionTypes={["nav-forward"]}
          className="group mt-10 inline-flex items-center gap-2 text-sm font-medium text-accent-strong dark:text-accent"
        >
          <T
            en={`View all ${projects.length} projects`}
            id={`Lihat semua ${projects.length} proyek`}
          />
          <ArrowRight
            size={15}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </Link>
      </Reveal>
    </Section>
  );
}
