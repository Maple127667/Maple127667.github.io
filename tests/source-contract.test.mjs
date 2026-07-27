import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("page progress rail keeps its five section definitions", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /const sectionRailItems\s*=\s*\[/);
  for (const id of ["top", "projects", "notes", "about", "contact"]) {
    assert.match(source, new RegExp(`id:\\s*["']${id}["']`));
  }
});
