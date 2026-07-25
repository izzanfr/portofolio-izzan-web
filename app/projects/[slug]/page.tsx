import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { mdxComponents } from "@/mdx-components";
import { Reveal } from "@/components/ui/Reveal";
import { HairRule } from "@/components/ui/HairRule";
import { StatCard } from "@/components/ui/StatCard";
import { ProjectDocumentation } from "@/components/ui/ProjectDocumentation";
import { T } from "@/components/ui/T";
import { getAllProjects, getProject } from "@/lib/projects";
import { cn } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };

  // Metadata is single-locale and server-only; the English copy is the SEO base.
  return {
    title: `${project.title.en} · ${project.client.en}`,
    description: project.summary.en,
  };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const all = getAllProjects();
  const index = all.findIndex((item) => item.slug === slug);
  const next = all[(index + 1) % all.length];

  return (
    <article className="pb-24 pt-32 md:pt-40">
      <div className="container-page max-w-3xl">
        <Reveal>
          <Link
            href="/#projects"
            transitionTypes={["nav-back"]}
            className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent-strong dark:hover:text-accent"
          >
            <ArrowLeft
              size={15}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            <T en="All projects" id="Semua proyek" />
          </Link>
        </Reveal>

        <Reveal delay={0.06}>
          <h1 className="mt-8 text-balance text-center text-3xl leading-[1.06] tracking-display md:text-5xl">
            <T en={project.title.en} id={project.title.id} />
          </h1>

          <div className="mt-7">
            <HairRule />
            <dl className="grid justify-items-center gap-3 py-5 text-sm sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="shrink-0 text-accent-strong dark:text-accent" />
                <div>
                  <dt className="sr-only">
                    <T en="Client" id="Klien" />
                  </dt>
                  <dd className="leading-snug">
                    <T en={project.client.en} id={project.client.id} />
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <UserRound size={15} className="shrink-0 text-accent-strong dark:text-accent" />
                <div>
                  <dt className="sr-only">
                    <T en="Role" id="Peran" />
                  </dt>
                  <dd className="leading-snug">
                    <T en={project.role.en} id={project.role.id} />
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays size={15} className="shrink-0 text-accent-strong dark:text-accent" />
                <div>
                  <dt className="sr-only">
                    <T en="Period" id="Periode" />
                  </dt>
                  <dd className="font-mono text-xs leading-snug">
                    <T en={project.period.en} id={project.period.id} /> ·{" "}
                    <T en={project.duration.en} id={project.duration.id} />
                  </dd>
                </div>
              </div>
            </dl>
            <HairRule delay={0.12} />
          </div>
        </Reveal>

        {project.metrics.length > 0 && (
          <Reveal delay={0.12}>
            {/* Column count follows the metric count, and 1–2 cards are centred
                at card-width so they never leave an empty track dangling to the
                right the way a fixed 3-column grid did. */}
            <dl
              className={cn(
                "mt-8 grid gap-4 md:gap-5",
                project.metrics.length === 1 && "mx-auto max-w-xs",
                project.metrics.length === 2 && "mx-auto max-w-[520px] sm:grid-cols-2",
                project.metrics.length >= 3 && "sm:grid-cols-3",
              )}
            >
              {project.metrics.map((metric, i) => (
                <StatCard
                  key={i}
                  value={metric.value}
                  label={<T en={metric.label.en} id={metric.label.id} />}
                />
              ))}
            </dl>
          </Reveal>
        )}
      </div>

      {/* Broken out of the prose column: the documentation reads as its own wide
          gallery. Same page background — it renders nothing when the project has
          no images. */}
      <ProjectDocumentation images={project.documentationImages} title={project.title.en} />

      <div className="container-page max-w-3xl">
        <Reveal delay={0.16}>
          {/* Both languages are rendered; CSS (keyed on <html lang>) shows one.
              Two server-rendered MDX trees rather than a client re-render, so the
              switch is instant and needs no refetch. */}
          <div className="mt-14" data-lc="en">
            <MDXRemote source={project.content.en} components={mdxComponents} />
          </div>
          <div className="mt-14" data-lc="id">
            <MDXRemote source={project.content.id} components={mdxComponents} />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Link
            href={`/projects/${next.slug}`}
            transitionTypes={["nav-forward"]}
            className="group mt-16 flex items-center justify-between gap-6 rounded-card border border-border bg-surface/60 p-6 transition-colors duration-300 hover:border-accent/55"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                <T en="Next project" id="Proyek berikutnya" />
              </p>
              <p className="mt-2 font-semibold leading-snug">
                <T en={next.title.en} id={next.title.id} />
              </p>
              <p className="mt-1 text-sm text-muted">
                <T en={next.client.en} id={next.client.id} />
              </p>
            </div>
            <ArrowRight
              size={19}
              className="shrink-0 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent-strong dark:group-hover:text-accent"
            />
          </Link>
        </Reveal>
      </div>
    </article>
  );
}
