import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

export type ProjectMetric = { value: string; label: string };

/** One supporting image on a project's Documentation section. */
export type DocumentationImage = { src: string; alt: string; cover: boolean };

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

// Documentation images live only on the full Project, never on ProjectMeta, so
// the card list on the homepage keeps them out of its client bundle.
export type Project = ProjectMeta & {
  content: string;
  documentationImages: DocumentationImage[];
};

/**
 * Accepts either a bare path string or an object `{ src, alt?, cover? }` per
 * entry, so authoring a simple list stays terse while a marked cover is still
 * possible. Entries without a src are dropped, which is what keeps the section
 * from rendering for projects whose folder is still empty.
 */
function parseDocumentation(raw: unknown, title: string): DocumentationImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index): DocumentationImage => {
      const fallbackAlt = `${title} — documentation ${index + 1}`;
      if (typeof item === "string") {
        return { src: item, alt: fallbackAlt, cover: false };
      }
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return {
          src: String(record.src ?? ""),
          alt: String(record.alt ?? fallbackAlt),
          cover: Boolean(record.cover),
        };
      }
      return { src: "", alt: fallbackAlt, cover: false };
    })
    .filter((image) => image.src.length > 0);
}

function parse(filename: string): Project {
  const slug = filename.replace(/\.mdx?$/, "");
  const raw = fs.readFileSync(path.join(PROJECTS_DIR, filename), "utf8");
  const { data, content } = matter(raw);
  const title = String(data.title ?? slug);

  return {
    slug,
    title,
    client: String(data.client ?? ""),
    role: String(data.role ?? ""),
    period: String(data.period ?? ""),
    duration: String(data.duration ?? ""),
    order: Number(data.order ?? 999),
    featured: Boolean(data.featured),
    summary: String(data.summary ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    metrics: Array.isArray(data.metrics) ? (data.metrics as ProjectMetric[]) : [],
    documentationImages: parseDocumentation(data.documentationImages, title),
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
