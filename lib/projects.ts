import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

export type ProjectMetric = { value: string; label: string };

export type ProjectMeta = {
  slug: string;
  title: string;
  client: string;
  role: string;
  period: string;
  duration: string;
  order: number;
  featured: boolean;
  summary: string;
  tags: string[];
  metrics: ProjectMetric[];
};

export type Project = ProjectMeta & { content: string };

function parse(filename: string): Project {
  const slug = filename.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(PROJECTS_DIR, filename), "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: String(data.title ?? slug),
    client: String(data.client ?? ""),
    role: String(data.role ?? ""),
    period: String(data.period ?? ""),
    duration: String(data.duration ?? ""),
    order: Number(data.order ?? 999),
    featured: Boolean(data.featured),
    summary: String(data.summary ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    metrics: Array.isArray(data.metrics) ? (data.metrics as ProjectMetric[]) : [],
    content,
  };
}

/** All projects, newest engagement first (driven by the `order` frontmatter field). */
export function getAllProjects(): Project[] {
  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((file) => /\.mdx?$/.test(file))
    .map(parse)
    .sort((a, b) => a.order - b.order);
}

export function getProjectMeta(): ProjectMeta[] {
  // Listed field by field so MDX bodies never reach the client bundle
  return getAllProjects().map((project) => ({
    slug: project.slug,
    title: project.title,
    client: project.client,
    role: project.role,
    period: project.period,
    duration: project.duration,
    order: project.order,
    featured: project.featured,
    summary: project.summary,
    tags: project.tags,
    metrics: project.metrics,
  }));
}

export function getProject(slug: string): Project | undefined {
  return getAllProjects().find((project) => project.slug === slug);
}
