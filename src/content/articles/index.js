import { toString as nodeToString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { parse as parseYaml } from "yaml";

const articleFiles = import.meta.glob("./*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

const REQUIRED_FIELDS = ["title", "date", "category", "excerpt"];
const markdownParser = unified().use(remarkParse);

function parseMarkdownFile(path, source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    throw new Error(`${path} 缺少有效的 YAML Frontmatter`);
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

export function formatArticleDate(value) {
  return normalizeDate(value).replaceAll("-", ".");
}

export function headingIdFromText(value) {
  return String(value)
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractHeadings(tree) {
  const headings = [];
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

  return headings;
}

function calculateReadTime(tree) {
  const plainText = nodeToString(tree);
  const cjkCharacters = plainText.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)?.length ?? 0;
  const latinWords = plainText
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, " ")
    .match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil(cjkCharacters / 300 + latinWords / 200));

  return `${minutes} MIN READ`;
}

function createArticle(path, source) {
  const { data, content } = parseMarkdownFile(path, source);
  const missingFields = REQUIRED_FIELDS.filter((field) => !data[field]);

  if (missingFields.length) {
    throw new Error(`${path} 缺少 Frontmatter 字段：${missingFields.join(", ")}`);
  }

  const filename = path.split("/").pop().replace(/\.md$/, "");
  const date = normalizeDate(data.date);
  const tree = markdownParser.parse(content);

  return {
    id: String(data.id || filename),
    order: Number(data.order ?? Number.MAX_SAFE_INTEGER),
    title: String(data.title),
    date,
    category: String(data.category),
    excerpt: String(data.excerpt),
    featured: data.featured === true,
    body: content.trim(),
    headings: extractHeadings(tree),
    readTime: calculateReadTime(tree),
  };
}

const sortedArticles = Object.entries(articleFiles)
  .map(([path, source]) => createArticle(path, source))
  .sort((a, b) => a.order - b.order || b.date.localeCompare(a.date));

const duplicateIds = sortedArticles
  .map((article) => article.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);

if (duplicateIds.length) {
  throw new Error(`文章 id 必须唯一：${[...new Set(duplicateIds)].join(", ")}`);
}

export const articles = sortedArticles.map((article, index) => ({
  ...article,
  index: String(index + 1).padStart(2, "0"),
}));

export const featuredArticle = articles.find((article) => article.featured) ?? articles[0];
