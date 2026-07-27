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

  assert.equal(notFoundShell, shell);
  assert.equal(articleShell, shell);
  assert.equal(projectShell, shell);
});
