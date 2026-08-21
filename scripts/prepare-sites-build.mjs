#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const hosting = path.join(root, ".openai", "hosting.json");

for (const file of [index, worker, hosting]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

function contentRoutes(directory, collection) {
  return readdirSync(directory)
    .filter((filename) => filename.endsWith(".md") && !filename.endsWith(".en.md"))
    .map((filename) => {
      const source = readFileSync(path.join(directory, filename), "utf8");
      const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!frontmatter) throw new Error(`Missing Frontmatter: ${filename}`);
      const data = parseYaml(frontmatter[1]) ?? {};
      const id = String(data.id || filename.replace(/\.md$/, ""));
      return `/${collection}/${encodeURIComponent(id)}`;
    });
}

const knownRoutes = [
  ...contentRoutes(path.join(root, "src", "content", "articles"), "articles"),
  ...contentRoutes(path.join(root, "src", "content", "projects"), "projects"),
].sort();
const routeMarker = "const CONTENT_ROUTES = [];";
const workerTemplate = readFileSync(worker, "utf8");
if (!workerTemplate.includes(routeMarker)) throw new Error("Missing content route marker in worker");
const workerOutput = workerTemplate.replace(routeMarker, `const CONTENT_ROUTES = ${JSON.stringify(knownRoutes)};`);

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
writeFileSync(path.join(dist, "server", "index.js"), workerOutput);
writeFileSync(path.join(dist, ".openai", "hosting.json"), readFileSync(hosting));

console.log(`Prepared Sites build with ${knownRoutes.length} content routes`);