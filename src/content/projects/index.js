import {
  assertUniqueIds,
  parseMarkdownContent,
  parseMarkdownFile,
} from "../markdown.js";

const projectFiles = import.meta.glob("./*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

const REQUIRED_FIELDS = ["title", "year", "category", "excerpt", "cover"];

function createProject(path, source) {
  const { data, content } = parseMarkdownFile(path, source);
  const missingFields = REQUIRED_FIELDS.filter((field) => !data[field]);

  if (missingFields.length) {
    throw new Error(`${path} 缺少 Frontmatter 字段：${missingFields.join(", ")}`);
  }

  const filename = path.split("/").pop().replace(/\.md$/, "");

  return {
    id: String(data.id || filename),
    order: Number(data.order ?? Number.MAX_SAFE_INTEGER),
    title: String(data.title),
    year: String(data.year),
    category: String(data.category),
    excerpt: String(data.excerpt),
    cover: String(data.cover),
    align: data.align === "left" ? "left" : "right",
    ...parseMarkdownContent(content),
  };
}

const sortedProjects = Object.entries(projectFiles)
  .map(([path, source]) => createProject(path, source))
  .sort((a, b) => a.order - b.order || b.year.localeCompare(a.year));

assertUniqueIds(sortedProjects, "项目");

export const projects = sortedProjects.map((project, index) => ({
  ...project,
  index: String(index + 1).padStart(2, "0"),
}));
