import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectMarquee } from "@/components/ui/ProjectMarquee";
import { Scramble } from "@/components/ui/Scramble";
import { T } from "@/components/ui/T";
import { getProjectMeta } from "@/lib/projects";

export function Projects() {
  const projects = getProjectMeta();

  return (
    <Section
      id="projects"
      eyebrow={<Scramble en="Selected work" id="Karya pilihan" />}
      title={<T en="Projects" id="Proyek" />}
      tone="base"
      index={2}
      align="center"
      // The covers want the room the standard rhythm would otherwise spend on
      // whitespace above and below them.
      spacing="tight"
      // The band wants the whole screen. `svh` rather than `vh` so a phone's
      // retracting browser chrome cannot make the section taller than the
      // screen it is on and leave a strip of the next one showing.
      className="flex min-h-svh items-center"
    >
      <Reveal>
        <ProjectMarquee projects={projects} />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 flex justify-center">
          {/* Outlined rather than filled: the hero's call to action is the one
              solid pill on the page, and a second one competing with it here
              would flatten that hierarchy. This is the way onward, not the
              thing being asked for. */}
          <Link
            href="/projects"
            transitionTypes={["nav-forward"]}
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-medium transition-colors duration-300 hover:border-accent/55 hover:text-accent-strong dark:hover:text-accent"
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
        </div>
      </Reveal>
    </Section>
  );
}
