import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createContentManifest } from "../src/content/markdown-build.js";
import { createMarkdownBodyLoader } from "../src/content/markdown.js";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("markdown body loading retries after a transient failure and caches success", async () => {
  let attempts = 0;
  const loadBody = createMarkdownBodyLoader("./retry.md", {
    "./retry.md": async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary failure");
      return "---\ntitle: Retry\n---\n\nRecovered body";
    },
  });

  await assert.rejects(loadBody(), /temporary failure/);
  assert.equal(await loadBody(), "Recovered body");
  assert.equal(await loadBody(), "Recovered body");
  assert.equal(attempts, 2);
});

test("content manifest keeps locales paired and exposes embedded reader images", () => {
  const manifest = createContentManifest({
    articlesDirectory: path.join(rootDirectory, "src", "content", "articles"),
    projectsDirectory: path.join(rootDirectory, "src", "content", "projects"),
  });
  const searchEntries = manifest.projects.filter((entry) => entry.id === "search-agent");

  assert.deepEqual(searchEntries.map((entry) => entry.locale).sort(), ["en", "zh"]);
  searchEntries.forEach((entry) => {
    assert.deepEqual(entry.images, [
      "/assets/projects/search-agent-retrieval-staircase.webp",
      "/assets/projects/search-agent-evaluation-loop.webp",
    ]);
  });
});
