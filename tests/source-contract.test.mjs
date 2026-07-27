import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("page progress rail and profile flow stay complete", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const rail = source.match(/const sectionRailItems\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? "";
  const ids = [...rail.matchAll(/id:\s*["']([^"']+)["']/g)].map((match) => match[1]);

  assert.deepEqual(ids, ["top", "projects", "about", "notes", "contact"]);
  assert.match(source, /function ProfileSection\(\)/);
  assert.match(source, /from "\.\/content\/profile\.js"/);
  assert.match(source, /from "\.\/content\/projects\/index\.js"/);
  assert.match(source, /collection = type === "article" \? "articles" : "projects"/);
  assert.match(source, /function ProjectReader\(/);
  assert.doesNotMatch(source, /const projects\s*=/);
  assert.doesNotMatch(source, /className="notes-overview/);
  assert.doesNotMatch(source, /className="about snap-panel/);
});
