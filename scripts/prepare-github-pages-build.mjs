#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { BLOG_POSTS } from "../src/content/blogPosts.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "dist", "client");
const shell = path.join(client, "index.html");

if (!existsSync(shell)) {
  throw new Error("Missing GitHub Pages build input: dist/client/index.html");
}

function contentRouteIds(directory) {
  return readdirSync(directory)
    .filter((filename) => filename.endsWith(".md") && !filename.endsWith(".en.md"))
    .map((filename) => {
      const source = readFileSync(path.join(directory, filename), "utf8");
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!frontmatter) throw new Error(`Missing Frontmatter: ${filename}`);
      const data = parseYaml(frontmatter[1]) ?? {};
      return String(data.id || filename.replace(/\.md$/, ""));
    });
}

const routes = [
  ...contentRouteIds(path.join(root, "src", "content", "articles")).map((id) => ["articles", id]),
  ...contentRouteIds(path.join(root, "src", "content", "projects")).map((id) => ["projects", id]),
];

const blogDirectory = path.join(client, "blog");
mkdirSync(blogDirectory, { recursive: true });
copyFileSync(shell, path.join(blogDirectory, "index.html"));

for (const post of BLOG_POSTS) {
  const routeDirectory = path.join(blogDirectory, encodeURIComponent(post.slug));
  mkdirSync(routeDirectory, { recursive: true });
  copyFileSync(shell, path.join(routeDirectory, "index.html"));
}

for (const [collection, id] of routes) {
  const routeDirectory = path.join(client, collection, encodeURIComponent(id));
  mkdirSync(routeDirectory, { recursive: true });
  copyFileSync(shell, path.join(routeDirectory, "index.html"));
}

copyFileSync(shell, path.join(client, "404.html"));
console.log(`Prepared GitHub Pages build with ${routes.length + BLOG_POSTS.length + 1} route shells`);
