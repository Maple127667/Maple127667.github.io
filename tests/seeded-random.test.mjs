import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createSeededRandom,
  normalizeSimulationSeed,
} from "../src/seededRandom.js";

test("the same simulation seed reproduces the same momentum sequence", () => {
  const first = createSeededRandom("SEARCH-AGENT");
  const second = createSeededRandom("search agent");
  const third = createSeededRandom("ANOTHER-SEED");
  const firstSequence = Array.from({ length: 12 }, () => first());
  const secondSequence = Array.from({ length: 12 }, () => second());
  const thirdSequence = Array.from({ length: 12 }, () => third());

  assert.equal(normalizeSimulationSeed("  search agent  "), "SEARCH-AGENT");
  assert.deepEqual(firstSequence, secondSequence);
  assert.notDeepEqual(firstSequence, thirdSequence);
  firstSequence.forEach((value) => assert.ok(value >= 0 && value < 1));
});

test("the asteroid scene exposes a hidden seed editor and resets cycle one", async () => {
  const source = await readFile(new URL("../src/AsteroidScene.jsx", import.meta.url), "utf8");

  assert.match(source, /SEEDS \/ INITIALIZING/);
  assert.match(source, /const cycleKey = `\$\{activeSeed\}:\$\{cycleNumber\}`;/);
  assert.match(source, /cycleRandom = createSeededRandom\(cycleKey\);/);
  assert.match(source, /url\.searchParams\.set\("seed", activeSeed\)/);
  assert.match(source, /cycleNumber = 0;[\s\S]*resetSimulation\(\);/);
  assert.match(source, /aria-label=\{copy\.seed\.inputAria\}/);
});
