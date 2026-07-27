import {
  assertUniqueIds,
  calculateReadTime,
  formatArticleDate,
  normalizeDate,
  parseMarkdownContent,
  parseMarkdownFile,
} from "../markdown.js";

const articleFiles = import.meta.glob("./*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

const REQUIRED_FIELDS = ["title", "date", "category", "excerpt"];

function createArticle(path, source) {
  const { data, content } = parseMarkdownFile(path, source);
  const missingFields = REQUIRED_FIELDS.filter((field) => !data[field]);

  if (missingFields.length) {
    throw new Error(`${path} 缺少 Frontmatter 字段：${missingFields.join(", ")}`);
  }

  const filename = path.split("/").pop().replace(/\.md$/, "");
  const parsed = parseMarkdownContent(content);

  return {
    id: String(data.id || filename),
    order: Number(data.order ?? Number.MAX_SAFE_INTEGER),
    title: String(data.title),
    date: normalizeDate(data.date),
    category: String(data.category),
    excerpt: String(data.excerpt),
    featured: data.featured === true,
    ...parsed,
    readTime: calculateReadTime(parsed.plainText),
  };
}

const sortedArticles = Object.entries(articleFiles)
  .map(([path, source]) => createArticle(path, source))
  .sort((a, b) => a.order - b.order || b.date.localeCompare(a.date));

assertUniqueIds(sortedArticles, "文章");

export const articles = sortedArticles.map((article, index) => ({
  ...article,
  index: String(index + 1).padStart(2, "0"),
}));

export const featuredArticle = articles.find((article) => article.featured) ?? articles[0];
export { formatArticleDate };
