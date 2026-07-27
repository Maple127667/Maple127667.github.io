import { toString as nodeToString } from "mdast-util-to-string";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { parse as parseYaml } from "yaml";

const markdownParser = unified().use(remarkParse);

export function parseMarkdownFile(path, source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    throw new Error(`${path} 缺少有效的 YAML Frontmatter`);
  }

  return {
    data: parseYaml(match[1]) ?? {},
    content: match[2],
  };
}

export function normalizeDate(value) {
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

export function parseMarkdownContent(content) {
  const tree = markdownParser.parse(content);
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

  return {
    body: content.trim(),
    headings,
    plainText: nodeToString(tree),
  };
}

export function calculateReadTime(plainText) {
  const cjkCharacters = plainText.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)?.length ?? 0;
  const latinWords = plainText
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, " ")
    .match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;
  const minutes = Math.max(1, Math.ceil(cjkCharacters / 300 + latinWords / 200));

  return `${minutes} MIN READ`;
}

export function assertUniqueIds(items, label) {
  const duplicateIds = items
    .map((item) => item.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

  if (duplicateIds.length) {
    throw new Error(`${label} id 必须唯一：${[...new Set(duplicateIds)].join(", ")}`);
  }
}
