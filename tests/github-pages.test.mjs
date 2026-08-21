import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("emits GitHub Pages shells for direct content routes", async () => {
  const shell = await readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
  const notFoundShell = await readFile(new URL("../dist/client/404.html", import.meta.url), "utf8");
  const articleShell = await readFile(
    new URL("../dist/client/articles/vibe-coding/index.html", import.meta.url),
    "utf8",
  );
  const projectShell = await readFile(
    new URL("../dist/client/projects/search-agent/index.html", import.meta.url),
    "utf8",
  );
  const blogShell = await readFile(new URL("../dist/client/blog/index.html", import.meta.url), "utf8");
  const latestBlogPostShell = await readFile(
    new URL("../dist/client/blog/2026-08-03/index.html", import.meta.url),
    "utf8",
  );
  const firstBlogPostShell = await readFile(
    new URL("../dist/client/blog/2025-10-01/index.html", import.meta.url),
    "utf8",
  );
  const secondBlogPostShell = await readFile(
    new URL("../dist/client/blog/2023-10-12/index.html", import.meta.url),
    "utf8",
  );
  const thirdBlogPostShell = await readFile(
    new URL("../dist/client/blog/2022-05-04/index.html", import.meta.url),
    "utf8",
  );

  assert.equal(notFoundShell, shell);
  assert.equal(articleShell, shell);
  assert.equal(projectShell, shell);
  assert.equal(blogShell, shell);
  assert.equal(latestBlogPostShell, shell);
  assert.equal(firstBlogPostShell, shell);
  assert.equal(secondBlogPostShell, shell);
  assert.equal(thirdBlogPostShell, shell);
});
