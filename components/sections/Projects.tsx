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
          <p className="journey-kicker"><T en="SELECTED WORK / CONSULTING PORTFOLIO" id="KARYA PILIHAN / PORTOFOLIO KONSULTASI" /></p>
          <h2><T en="Ideas into impact." id="Gagasan menjadi dampak." /></h2>
          <p><T en={`${projects.length} projects. Real institutions. Lasting change.`} id={`${projects.length} proyek. Institusi nyata. Perubahan berkelanjutan.`} /></p>
        </header>
        <div className="container-page"><ProjectMarquee projects={projects} /></div>
        <footer className="projects-footer">
          <span className="projects-footer-note"><T en="PROJECTS · DRAG TO EXPLORE" id="PROYEK · GESER UNTUK MENJELAJAHI" /></span>
          <Link href="/projects" transitionTypes={["nav-forward"]}><T en={`Explore all ${projects.length} projects`} id={`Jelajahi ${projects.length} proyek`} /><ArrowUpRight size={16} /></Link>
        </footer>
      </div>
    </section>
  );
}
