import { projectManifest } from "virtual:portfolio-content-manifest";
import {
  assertUniqueIds,
  createMarkdownBodyLoader,
} from "../markdown.js";

const projectFiles = import.meta.glob("./*.md", {
  import: "default",
  query: "?raw",
});

const REQUIRED_FIELDS = ["title", "year", "category", "excerpt", "cover"];

function createProject(entry) {
  const { data, headings, images, path } = entry;
  const missingFields = REQUIRED_FIELDS.filter((field) => !data[field]);

  if (missingFields.length) {
    throw new Error(`${path} 缺少 Frontmatter 字段：${missingFields.join(", ")}`);
  }

  return {
    id: entry.id,
    order: Number(data.order ?? Number.MAX_SAFE_INTEGER),
    title: String(data.title),
    headline: data.headline ? String(data.headline) : String(data.title),
    year: String(data.year),
    link: data.linkUrl
      ? {
          url: String(data.linkUrl),
          label: String(data.linkLabel || (entry.locale === "en" ? "Visit project" : "访问项目")),
          type: data.linkType === "github" ? "github" : "website",
        }
      : null,
    category: String(data.category),
    excerpt: String(data.excerpt),
    cover: String(data.cover),
    coverFit: data.coverFit === "contain" ? "contain" : "cover",
    coverPosition: String(data.coverPosition || "center center"),
    coverBackground: String(data.coverBackground || "#03070d"),
    technologies: Array.isArray(data.technologies)
      ? data.technologies.map((technology) => String(technology).trim()).filter(Boolean)
      : [],
    status: data.status ? String(data.status) : null,
    align: data.align === "left" ? "left" : "right",
    headings,
    images,
    loadBody: createMarkdownBodyLoader(path, projectFiles),
  };
}

const zhProjects = projectManifest
  .filter((entry) => entry.locale !== "en")
  .map(createProject)
  .sort((a, b) => a.order - b.order || b.year.localeCompare(a.year));

assertUniqueIds(zhProjects, "项目");

const canonicalProjects = zhProjects.map((project, index) => ({
  ...project,
  index: String(index + 1).padStart(2, "0"),
}));

const enProjectById = new Map(
  projectManifest
    .filter((entry) => entry.locale === "en")
    .map((entry) => [entry.id, createProject(entry)]),
);

export function getProjects(locale) {
  if (locale !== "en") return canonicalProjects;
  return canonicalProjects.map((project) => {
    const enProject = enProjectById.get(project.id);
    if (!enProject) return project;
    return {
      ...enProject,
      order: project.order,
      index: project.index,
    };
  });
}

export const projects = canonicalProjects;
