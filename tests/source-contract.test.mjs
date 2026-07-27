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

test("markdown section numbers stay stable across repeated renders", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.doesNotMatch(appSource, /headingCursor/);
  assert.match(appSource, /function remarkHeadingIndexes\(\)/);
  assert.match(appSource, /"data-heading-index": headingIndex/);
  assert.match(appSource, /node\?\.properties\?\.dataHeadingIndex/);
  assert.match(appSource, /remarkPlugins=\{\[remarkGfm, remarkHeadingIndexes\]\}/);
});
test("small interface type stays above the legibility floor", async () => {
  const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(cssSource, /ibm-plex-mono\/500\.css/);
  assert.doesNotMatch(cssSource, /font:\s*(?:10|11|12)px\//);
  assert.doesNotMatch(cssSource, /font-size:\s*(?:10|11|12)px/);
});
test("unknown routes render a real 404 state", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /function NotFoundPage\(/);
  assert.match(source, /const isNotFound = pathname !== "\/"/);
  assert.match(source, /if \(isNotFound\) return <NotFoundPage/);
  assert.doesNotMatch(source, /if \(!contentRoute \|\| readerOpen\) return/);
});

test("Three.js lives behind a deferred dynamic import", async () => {
  const [appSource, sceneSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AsteroidScene.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(appSource, /lazy\(\(\) => import\("\.\/AsteroidScene\.jsx"\)\)/);
  assert.match(appSource, /requestIdleCallback/);
  assert.doesNotMatch(appSource, /from "three"/);
  assert.match(sceneSource, /from "three"/);
});
