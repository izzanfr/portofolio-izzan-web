import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { mdxComponents } from "@/mdx-components";
import { Reveal } from "@/components/ui/Reveal";
import { getAllProjects, getProject } from "@/lib/projects";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };

  return {
    title: `${project.title} — ${project.client}`,
    description: project.summary,
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
            className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent-strong dark:hover:text-accent"
          >
            <ArrowLeft
              size={15}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            All projects
          </Link>
        </Reveal>

        <Reveal delay={0.06}>
          <ul className="mt-8 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-border bg-surface/60 px-2.5 py-1 text-[11px] text-muted"
              >
                {tag}
              </li>
            ))}
          </ul>

          <h1 className="mt-5 text-balance text-3xl leading-[1.06] tracking-display md:text-5xl">
            {project.title}
          </h1>

          <dl className="mt-7 grid gap-3 border-y border-border py-5 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="shrink-0 text-accent-strong dark:text-accent" />
              <div>
                <dt className="sr-only">Client</dt>
                <dd className="leading-snug">{project.client}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserRound size={15} className="shrink-0 text-accent-strong dark:text-accent" />
              <div>
                <dt className="sr-only">Role</dt>
                <dd className="leading-snug">{project.role}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="shrink-0 text-accent-strong dark:text-accent" />
              <div>
                <dt className="sr-only">Period</dt>
                <dd className="font-mono text-xs leading-snug">
                  {project.period} · {project.duration}
                </dd>
              </div>
            </div>
          </dl>
        </Reveal>

        {project.metrics.length > 0 && (
          <Reveal delay={0.12}>
            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {project.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-card border border-border bg-surface/60 p-5"
                >
                  <dt className="font-mono text-2xl font-semibold text-accent-strong dark:text-accent">
                    {metric.value}
                  </dt>
                  <dd className="mt-1.5 text-xs leading-snug text-muted">{metric.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}

        <Reveal delay={0.16}>
          <div className="mt-14">
            <MDXRemote source={project.content} components={mdxComponents} />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Link
            href={`/projects/${next.slug}`}
            className="group mt-16 flex items-center justify-between gap-6 rounded-card border border-border bg-surface/60 p-6 transition-colors duration-300 hover:border-accent/55"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                Next project
              </p>
              <p className="mt-2 font-semibold leading-snug">{next.title}</p>
              <p className="mt-1 text-sm text-muted">{next.client}</p>
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
