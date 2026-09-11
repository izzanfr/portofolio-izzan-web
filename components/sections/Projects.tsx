import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProjectMarquee } from "@/components/ui/ProjectMarquee";
import { SectionBackdrop } from "@/components/ui/SectionBackdrop";
import { T } from "@/components/ui/T";
import { getProjectMeta } from "@/lib/projects";

export function Projects() {
  const projects = getProjectMeta();
  return (
    <section id="projects" className="projects-page">
      {/* The ambient wash Hero and the other sections carry. Without it this
          was the one flat ground on the page, and coming straight off
          Experience's cool grey it read as plain white rather than as the
          same off-white the Hero sits on. */}
      <SectionBackdrop index={2} />
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
