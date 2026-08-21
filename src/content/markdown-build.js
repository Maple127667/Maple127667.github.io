import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { toString as nodeToString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { parse as parseYaml } from "yaml";

const markdownParser = unified().use(remarkParse);
const ARTICLE_REQUIRED_FIELDS = ["title", "date", "category", "excerpt"];
const PROJECT_REQUIRED_FIELDS = ["title", "year", "category", "excerpt", "cover"];

function parseMarkdownFile(filePath, source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    throw new Error(`${filePath} 缺少有效的 YAML Frontmatter`);
  }

  return {
    data: parseYaml(match[1]) ?? {},
    content: match[2],
  };
}

function normalizeDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value ?? "").trim();
}

function headingIdFromText(value) {
  return String(value)
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseMarkdownContent(content) {
  const tree = markdownParser.parse(content);
  const headings = [];
  const images = [];
  const seenIds = new Map();

  visit(tree, "heading", (node) => {
    if (node.depth !== 2) return;
    const title = nodeToString(node).trim();
    const baseId = headingIdFromText(title) || "section";
    const count = seenIds.get(baseId) ?? 0;
    seenIds.set(baseId, count + 1);
    headings.push({
      title,
      id: count === 0 ? baseId : `${baseId}-${count + 1}`,
    });
  });

  visit(tree, "image", (node) => {
    const url = String(node.url ?? "").trim();
    if (url) images.push(url);
  });

  return {
    headings,
    images: [...new Set(images)],
    plainText: nodeToString(tree),
  };
}

function calculateReadTime(plainText) {
  const cjkCharacters = plainText.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)?.length ?? 0;
  const latinWords = plainText
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, " ")
    .match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil(cjkCharacters / 300 + latinWords / 200));

  return `${minutes} MIN READ`;
}

function assertRequiredFields(filePath, data, requiredFields) {
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length) {
    throw new Error(`${filePath} 缺少 Frontmatter 字段：${missingFields.join(", ")}`);
  }
}

function assertUniqueIds(items, label) {
  const duplicateIds = items
    .map((item) => item.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

  if (duplicateIds.length) {
    throw new Error(`${label} id 必须唯一：${[...new Set(duplicateIds)].join(", ")}`);
  }
}

function assertRouteSafeIds(items, label) {
  const unsafeIds = items
    .map((item) => item.id)
    .filter((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id));

  if (unsafeIds.length) {
    throw new Error(`${label} id 必须是小写字母、数字和连字符组成的安全路径：${unsafeIds.join(", ")}`);
  }
}

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => ({
      absolutePath: path.join(directory, entry.name),
      filename: entry.name,
      modulePath: `./${entry.name}`,
      locale: entry.name.endsWith(".en.md") ? "en" : "zh",
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

function articleManifestEntry(file) {
  const source = readFileSync(file.absolutePath, "utf8");
  const { data, content } = parseMarkdownFile(file.modulePath, source);
  assertRequiredFields(file.modulePath, data, ARTICLE_REQUIRED_FIELDS);
  const filename = file.filename.replace(/\.md$/, "").replace(/\.en$/, "");
  const parsed = parseMarkdownContent(content);
  const normalizedData = {
    ...data,
    date: normalizeDate(data.date),
  };

  return {
    path: file.modulePath,
    id: String(data.id || filename),
    locale: file.locale,
    data: normalizedData,
    headings: parsed.headings,
    images: parsed.images,
    readTime: calculateReadTime(parsed.plainText),
  };
}

function projectManifestEntry(file) {
  const source = readFileSync(file.absolutePath, "utf8");
  const { data, content } = parseMarkdownFile(file.modulePath, source);
  assertRequiredFields(file.modulePath, data, PROJECT_REQUIRED_FIELDS);
  const filename = file.filename.replace(/\.md$/, "").replace(/\.en$/, "");
  const parsed = parseMarkdownContent(content);

  return {
    path: file.modulePath,
    id: String(data.id || filename),
    locale: file.locale,
    data,
    headings: parsed.headings,
    images: parsed.images,
  };
}

function assertUniqueIdsPerLocale(items, label) {
  const locales = [...new Set(items.map((item) => item.locale))];
  locales.forEach((locale) => {
    assertUniqueIds(items.filter((item) => item.locale === locale), `${label}(${locale})`);
  });
}

export function createContentManifest({ articlesDirectory, projectsDirectory }) {
  const articleFiles = markdownFiles(articlesDirectory);
  const projectFiles = markdownFiles(projectsDirectory);
  const articles = articleFiles.map(articleManifestEntry);
  const projects = projectFiles.map(projectManifestEntry);

  assertUniqueIdsPerLocale(articles, "文章");
  assertUniqueIdsPerLocale(projects, "项目");
  assertRouteSafeIds(articles, "文章");
  assertRouteSafeIds(projects, "项目");

  return {
    articles,
    projects,
    watchFiles: [
      ...articleFiles.map((file) => file.absolutePath),
      ...projectFiles.map((file) => file.absolutePath),
    ],
  };
}
