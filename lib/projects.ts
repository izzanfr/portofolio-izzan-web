import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { BiText, BiList } from "@/lib/i18n";

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");
// Indonesian case studies mirror the English ones by filename, one folder down.
const PROJECTS_DIR_ID = path.join(PROJECTS_DIR, "id");

export type ProjectMetric = { value: string; label: BiText };

/** One supporting image on a project's Documentation section. Language-neutral. */
export type DocumentationImage = { src: string; alt: string; cover: boolean };

/**
 * Projects are bilingual. The English `.mdx` under content/projects is the
 * structural source of truth (slug, order, featured, documentation images) and
 * the English copy; the Indonesian `.mdx` under content/projects/id mirrors the
 * translatable frontmatter and body. Everything a visitor reads is paired as
 * `{ en, id }` so cards and the detail page dual-render and CSS shows one.
 */
export type ProjectMeta = {
  slug: string;
  order: number;
  featured: boolean;
  title: BiText;
  client: BiText;
  role: BiText;
  period: BiText;
  duration: BiText;
  summary: BiText;
  /**
   * The single image the card leads with. Just the one — the card only ever
   * shows a cover, so shipping the whole documentation array to the client
   * would be dead payload. Null when the project has no documentation yet,
   * which is the signal for the card's generated fallback.
   */
  cover: DocumentationImage | null;
};

// MDX bodies, the full image set, tags and metrics live only on the full
// Project, never on ProjectMeta: the card list on the homepage renders none of
// them, so this is what keeps them out of its client bundle.
export type Project = ProjectMeta & {
  content: BiText;
  documentationImages: DocumentationImage[];
  tags: BiList;
  metrics: ProjectMetric[];
};

type Frontmatter = Record<string, unknown>;

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

/**
 * The image the card leads with: the one flagged `cover`, else the first in the
 * list. Same precedence the Documentation coverflow uses, so the card and the
 * detail page open on the same document rather than disagreeing.
 */
function pickCover(images: DocumentationImage[]): DocumentationImage | null {
  if (images.length === 0) return null;
  return images.find((image) => image.cover) ?? images[0];
}

/** Read and split one MDX file, or return null if it isn't there (a project
 *  whose Indonesian translation hasn't been written yet falls back to English). */
function read(dir: string, filename: string): { data: Frontmatter; content: string } | null {
  const full = path.join(dir, filename);
  if (!fs.existsSync(full)) return null;
  const { data, content } = matter(fs.readFileSync(full, "utf8"));
  return { data, content };
}

const bi = (en: string, id: string | undefined): BiText => ({ en, id: id ?? en });

function parseMetrics(en: unknown, id: unknown): ProjectMetric[] {
  const enList = Array.isArray(en) ? (en as { value?: unknown; label?: unknown }[]) : [];
  const idList = Array.isArray(id) ? (id as { label?: unknown }[]) : [];
  return enList.map((metric, i) => ({
    value: String(metric.value ?? ""),
    label: bi(String(metric.label ?? ""), idList[i]?.label ? String(idList[i].label) : undefined),
  }));
}

function parse(filename: string): Project {
  const slug = filename.replace(/\.mdx?$/, "");
  const en = read(PROJECTS_DIR, filename);
  if (!en) throw new Error(`Missing project source: ${filename}`);
  const id = read(PROJECTS_DIR_ID, filename);

  const e = en.data;
  const i = id?.data ?? {};
  const title = String(e.title ?? slug);

  const enTags = Array.isArray(e.tags) ? e.tags.map(String) : [];
  const idTags = Array.isArray(i.tags) && i.tags.length === enTags.length ? i.tags.map(String) : enTags;
  const documentationImages = parseDocumentation(e.documentationImages, title);

  return {
    slug,
    order: Number(e.order ?? 999),
    featured: Boolean(e.featured),
    title: bi(title, i.title ? String(i.title) : undefined),
    client: bi(String(e.client ?? ""), i.client ? String(i.client) : undefined),
    role: bi(String(e.role ?? ""), i.role ? String(i.role) : undefined),
    period: bi(String(e.period ?? ""), i.period ? String(i.period) : undefined),
    duration: bi(String(e.duration ?? ""), i.duration ? String(i.duration) : undefined),
    summary: bi(String(e.summary ?? ""), i.summary ? String(i.summary) : undefined),
    tags: { en: enTags, id: idTags },
    metrics: parseMetrics(e.metrics, i.metrics),
    documentationImages,
    cover: pickCover(documentationImages),
    content: bi(en.content, id?.content),
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
  // Listed field by field so the MDX body, the full image set, tags and metrics
  // never reach the client bundle — the card renders none of them.
  return getAllProjects().map((project) => ({
    slug: project.slug,
    order: project.order,
    featured: project.featured,
    title: project.title,
    client: project.client,
    role: project.role,
    period: project.period,
    duration: project.duration,
    summary: project.summary,
    cover: project.cover,
  }));
}

export function getProject(slug: string): Project | undefined {
  return getAllProjects().find((project) => project.slug === slug);
}
