import { articleManifest } from "virtual:portfolio-content-manifest";
import {
  assertUniqueIds,
  createMarkdownBodyLoader,
  formatArticleDate,
  normalizeDate,
} from "../markdown.js";

const articleFiles = import.meta.glob("./*.md", {
  import: "default",
  query: "?raw",
});

const REQUIRED_FIELDS = ["title", "date", "category", "excerpt"];

function createArticle(entry) {
  const { data, headings, images, path, readTime } = entry;
  const missingFields = REQUIRED_FIELDS.filter((field) => !data[field]);

  if (missingFields.length) {
    throw new Error(`${path} 缺少 Frontmatter 字段：${missingFields.join(", ")}`);
  }

  return {
    id: entry.id,
    order: Number(data.order ?? Number.MAX_SAFE_INTEGER),
    title: String(data.title),
    date: normalizeDate(data.date),
    category: String(data.category),
    excerpt: String(data.excerpt),
    featured: data.featured === true,
    headings,
    images,
    readTime,
    loadBody: createMarkdownBodyLoader(path, articleFiles),
  };
}

const zhArticles = articleManifest
  .filter((entry) => entry.locale !== "en")
  .map(createArticle)
  .sort((a, b) => a.order - b.order || b.date.localeCompare(a.date));

assertUniqueIds(zhArticles, "文章");

const canonicalArticles = zhArticles.map((article, index) => ({
  ...article,
  index: String(index + 1).padStart(2, "0"),
}));

const enArticleById = new Map(
  articleManifest
    .filter((entry) => entry.locale === "en")
    .map((entry) => [entry.id, createArticle(entry)]),
);

export function getArticles(locale) {
  if (locale !== "en") return canonicalArticles;
  return canonicalArticles.map((article) => {
    const enArticle = enArticleById.get(article.id);
    if (!enArticle) return article;
    return {
      ...enArticle,
      order: article.order,
      featured: article.featured,
      index: article.index,
    };
  });
}

export function getFeaturedArticle(locale) {
  const localized = getArticles(locale);
  return localized.find((article) => article.featured) ?? localized[0];
}

export const articles = canonicalArticles;
export const featuredArticle = getFeaturedArticle("zh");
export { formatArticleDate };
