import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProjectMarquee } from "@/components/ui/ProjectMarquee";
import { T } from "@/components/ui/T";
import { getProjectMeta } from "@/lib/projects";

export function Projects() {
  const projects = getProjectMeta();
  return (
    <section id="projects" className="projects-page">
      <div className="projects-page-inner">
        <header className="projects-heading">
          <p className="journey-kicker"><T en={`SELECTED WORK / ${projects.length} CONSULTING PROJECTS`} id={`KARYA PILIHAN / ${projects.length} PROYEK KONSULTASI`} /></p>
          <h2><T en="Projects" id="Proyek" /></h2>
        </header>
        <div className="container-page"><ProjectMarquee projects={projects} /></div>
        <footer className="projects-footer">
          <Link href="/projects" transitionTypes={["nav-forward"]}><T en={`Explore all ${projects.length} projects`} id={`Jelajahi ${projects.length} proyek`} /><ArrowUpRight size={16} /></Link>
        </footer>
      </div>
    </section>
  );
}
