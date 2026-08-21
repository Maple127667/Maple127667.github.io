import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createContentManifest } from "../src/content/markdown-build.js";
import { uiCopy } from "../src/content/ui-copy.js";

test("page progress rail follows the project-ring journey", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const rail = source.match(/const sectionRailItems\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? "";
  const ids = [...rail.matchAll(/id:\s*["']([^"']+)["']/g)].map((match) => match[1]);
  assert.deepEqual(ids, ["top", "projects", "stack", "contact"]);

  const copySource = await readFile(new URL("../src/content/ui-copy.js", import.meta.url), "utf8");
  assert.match(copySource, /top:\s*\{\s*label:\s*"首页",\s*navLabel:\s*"关于我"\s*\}/);
  assert.match(copySource, /projects:\s*\{\s*label:\s*"作品",\s*navLabel:\s*"作品"\s*\}/);
  assert.match(copySource, /stack:\s*\{\s*label:\s*"技术栈",\s*navLabel:\s*"技术栈"\s*\}/);
  assert.match(copySource, /contact:\s*\{\s*label:\s*"文章与联系",\s*navLabel:\s*"文章 \/ 联系"\s*\}/);
  assert.match(source, /sectionRailItems\.map\(\(item\) => <a key=\{item\.id\} href=\{`#\$\{item\.id\}`\}/);
  assert.match(source, /className="site-nav__label">\{copy\.rail\[item\.id\]\.navLabel\}<\/span>/);
  assert.match(source, /from "\.\/content\/projects\/index\.js"/);
  assert.match(source, /from "\.\/PortfolioJourney\.jsx"/);
  assert.match(source, /<PortfolioJourney[^>]*projects=\{localizedProjects\}[^>]*onOpenProject=\{openProject\}/);
  assert.match(source, /collection = type === "article" \? "articles" : "projects"/);
  assert.match(source, /function ProjectReader\(/);
  assert.doesNotMatch(source, /const projects\s*=/);
  assert.doesNotMatch(source, /className="notes-overview/);
  assert.doesNotMatch(source, /className="about snap-panel/);
});

test("hero identity hierarchy keeps Maple primary and annotates the role in Chinese", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /className="hero__name"/);
  assert.match(source, /className="hero__role-lockup"/);
  assert.match(source, /className="hero__role-en">CREATIVE DEVELOPER/);
  assert.match(source, /className="hero__role-cn"/);
  const copySource = await readFile(new URL("../src/content/ui-copy.js", import.meta.url), "utf8");
  assert.match(copySource, /创意型工程师/);
  assert.match(copySource, /AI 应用与 Agent 系统/);
  assert.match(copySource, /AI Applications & Agent Systems/);
});
test("markdown section numbers stay stable across repeated renders", async () => {
  const [appSource, markdownSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/MarkdownContent.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(appSource, /import\("\.\/MarkdownContent\.jsx"\)/);
  assert.match(appSource, /const LazyMarkdownContent = lazy\(loadMarkdownContentModule\)/);
  assert.doesNotMatch(markdownSource, /headingCursor/);
  assert.match(markdownSource, /function remarkHeadingIndexes\(\)/);
  assert.match(markdownSource, /"data-heading-index": headingIndex/);
  assert.match(markdownSource, /node\?\.properties\?\.dataHeadingIndex/);
  assert.match(markdownSource, /const MARKDOWN_PLUGINS = \[remarkGfm, remarkHeadingIndexes\]/);
  assert.match(markdownSource, /remarkPlugins=\{MARKDOWN_PLUGINS\}/);
});
test("small interface type stays above the legibility floor", async () => {
  const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(cssSource, /@fontsource-variable\/inter/);
  assert.doesNotMatch(cssSource, /IBM Plex|ibm-plex|var\(--mono\)/i);
  assert.doesNotMatch(cssSource, /font:\s*(?:10|11|12)px\//);
  assert.doesNotMatch(cssSource, /font-size:\s*(?:10|11|12)px/);
});
test("Chinese flagship project labels use the UI sans stack", async () => {
  const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  const siteNavigationRule = cssSource.match(/\.site-nav a\s*\{([^}]*)\}/)?.[1] ?? "";

  assert.match(cssSource, /--ui:\s*"Inter Variable",\s*Inter,\s*system-ui/);
  assert.match(cssSource, /--code:\s*"Cascadia Code"/);
  assert.match(cssSource, /\.project__kicker\s*\{[^}]*font:\s*500 15px\/1\.5 var\(--ui\)[^}]*letter-spacing:\s*0/);
  assert.match(cssSource, /\.project__status\s*\{[^}]*font:\s*500 14px\/1\.5 var\(--ui\)[^}]*letter-spacing:\s*0/);
  assert.match(cssSource, /\.project__copy \.text-link\s*\{[^}]*font:\s*500 15px\/1\.3 var\(--ui\)[^}]*letter-spacing:\s*0/);
  assert.match(siteNavigationRule, /font:\s*[5-9]\d{2} 14px\/[^;]+var\(--ui\)/);
  assert.match(siteNavigationRule, /letter-spacing:\s*0/);
});
test("unknown routes render a real 404 state", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(source, /function NotFoundPage\(/);
  assert.match(source, /const isNotFound = pathname !== "\/" && \(!contentRoute \|\| !readerOpen\)/);
  assert.match(source, /\{isNotFound \? <div[\s\S]*?<NotFoundPage path=\{pathname\}/);
  assert.doesNotMatch(source, /if \(!contentRoute \|\| readerOpen\) return/);
});

test("Three.js uses one cached lazy module behind the readiness gate", async () => {
  const [appSource, sceneSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/AsteroidScene.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(appSource, /let asteroidSceneModulePromise/);
  assert.match(appSource, /asteroidSceneModulePromise \?\?= import\("\.\/AsteroidScene\.jsx"\)/);
  assert.match(appSource, /const LazyAsteroidScene = lazy\(loadAsteroidSceneModule\)/);
  assert.match(appSource, /<LazyAsteroidScene onProgress=\{onProgress\} onReady=\{onReady\}/);
  assert.match(appSource, /const bootReady = sceneReadyForPage && criticalLoadMatchesPage && criticalLoad\.ready && readerContentReady/);
  assert.match(appSource, /const sceneEnabled = true/);
  assert.match(sceneSource, /renderer\.setClearColor\(0x000000, 0\)/);
  assert.match(sceneSource, /renderer\.setClearAlpha\(0\)/);
  assert.doesNotMatch(appSource, /from "three"/);
  assert.match(sceneSource, /from "three"/);
});

test("boot completion follows verified scene and page resource progress", async () => {
  const [appSource, loaderSource, resourceSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/VibeBootLoader.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/criticalResourceLoader.js", import.meta.url), "utf8"),
  ]);

  assert.match(appSource, /const bootReady = sceneReadyForPage && criticalLoadMatchesPage && criticalLoad\.ready && readerContentReady/);
  assert.match(appSource, /const sceneReadyForPage = isNotFound \|\| sceneLoad\.ready/);
  assert.match(appSource, /images: isNotFound\s*\? \[\]/);
  assert.match(appSource, /progress=\{bootProgress\}/);
  assert.match(appSource, /localizedProjects\.map\(\(project\) => project\.cover\)/);
  assert.match(appSource, /<ArticleReader article=\{activeArticle\} interactive=\{!booting\}/);
  assert.match(appSource, /<ProjectReader project=\{activeProject\} interactive=\{!booting\}/);
  assert.match(loaderSource, /verifiedProgress \* 0\.95 \+ \(fontsReady \? 0\.05 : 0\)/);
  assert.doesNotMatch(loaderSource, /targetProgress[^;]+:\s*0\.95/);
  assert.match(resourceSource, /image\.decode/);
  assert.match(resourceSource, /status: "timeout"/);
});
test("featured essay title keeps its semantic two-line break", async () => {
  const [appSource, cssSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(appSource, /titleBreakIndex = article\.title\.indexOf\("："\)/);
  assert.match(appSource, /className="featured-note__title-line"/);
  assert.match(cssSource, /\.featured-note__title-line \{ display: block; \}/);
  assert.match(cssSource, /@media \(min-width: 761px\)[\s\S]*?\.featured-note__title-line \{ white-space: nowrap; \}/);
});
test("all published projects feed the equal-weight interactive ring", async () => {
  const [appSource, journeySource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/PortfolioJourney.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(appSource, /<PortfolioJourney[^>]*projects=\{localizedProjects\}[^>]*onOpenProject=\{openProject\}/);
  assert.match(journeySource, /projects\.map\(\(project, projectIndex\) =>/);
  assert.match(journeySource, /className="portfolio-project__open-hit"/);
  const openProjectCalls = [...journeySource.matchAll(/onOpenProject\(project\.id,\s*projectRefs\.current\.get\(project\.id\),\s*event\.currentTarget\)/g)];
  assert.equal(openProjectCalls.length, 2);
  assert.match(journeySource, /project\.technologies\.map/);
  assert.match(journeySource, /AUTO \/ \{rotationPaused \? "OFF" : "ON"\}/);
});
test("returning from a reader restores the captured native scroll position", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /previousFocus\?\.isConnected[\s\S]*!previousFocus\.closest\?\.\("\[inert\]"\)[\s\S]*previousFocus\.focus\(\{ preventScroll: true \}\)/);
  assert.match(appSource, /const pendingReturnScrollYRef = useRef\(null\)/);
  assert.match(appSource, /contentReturnY: returnScrollY/);
  assert.match(appSource, /restoreReaderReturnPosition\(returnScrollY\)/);
  assert.match(appSource, /skipHashRestoreRef\.current = true/);
  assert.match(appSource, /window\.requestAnimationFrame\(\(\) => \{\s*window\.requestAnimationFrame\(\(\) => \{\s*window\.scrollTo\(\{ top: returnScrollY, behavior: "auto" \}\)/);
});

test("published projects expose their primary external destinations", async () => {
  const [appSource, indexSource, searchSource, shianSource, maibotSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/content/projects/index.js", import.meta.url), "utf8"),
    readFile(new URL("../src/content/projects/search-agent.md", import.meta.url), "utf8"),
    readFile(new URL("../src/content/projects/shian-official.md", import.meta.url), "utf8"),
    readFile(new URL("../src/content/projects/maibot.md", import.meta.url), "utf8"),
  ]);

  assert.match(indexSource, /linkUrl/);
  assert.match(appSource, /function ProjectExternalLink\(/);
  assert.match(appSource, /className=\{`project-external-link\$\{compact \? " project-external-link--compact" : ""\}`\}/);
  assert.match(searchSource, /github\.com\/Maple127667\/search_agent/);
  assert.match(shianSource, /https:\/\/shian-manual\.top\//);
  assert.match(maibotSource, /github\.com\/Mai-with-u\/MaiBot/);
});

test("contact details use the published email and WeChat QR identity", async () => {
  const [appSource, profileSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/content/profile.js", import.meta.url), "utf8"),
  ]);

  assert.match(profileSource, /1276679255@qq\.com/);
  assert.match(profileSource, /Maple127667/);
  assert.match(profileSource, /wechat-maple127667\.jpg/);
  assert.match(appSource, /className="contact__qr"/);
  assert.match(appSource, /function WechatDialog/);
  assert.match(appSource, /aria-haspopup="dialog"/);
  assert.doesNotMatch(appSource, /扫码添加微信/);
  assert.match(appSource, /WechatLogo/);
});

test("markdown images open in an accessible lightbox", async () => {
  const [appSource, markdownSource, cssSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/MarkdownContent.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(appSource, /import\("\.\/MarkdownContent\.jsx"\)/);
  assert.match(markdownSource, /export default function MarkdownContent\(/);
  assert.match(markdownSource, /className="article-image-button"[^>]*onClick=\{\(\) => onOpenImage\(\{ src, alt \}\)\}/);
  assert.match(markdownSource, /className="image-lightbox" role="dialog" aria-modal="true"/);
  assert.match(markdownSource, /aria-label=\{copy\.reader\.closePreview\}/);
  assert.match(markdownSource, /window\.addEventListener\("keydown", onKeyDown, true\)/);
  assert.match(markdownSource, /previousReaderScrollTop[\s\S]*reader\.scrollTo\(\{ top: previousReaderScrollTop, behavior: "auto" \}\)/);
  assert.match(cssSource, /\.image-lightbox\s*\{/);
  assert.match(cssSource, /cursor:\s*zoom-in/);
});

test("UI copy dictionaries keep zh/en key parity", () => {
  const collectKeys = (value, prefix = "") => Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return entry && typeof entry === "object" && !Array.isArray(entry)
      ? collectKeys(entry, path)
      : [path];
  });

  assert.deepEqual(collectKeys(uiCopy.en).sort(), collectKeys(uiCopy.zh).sort());
});

test("localized opening transcripts drive their own playback timing", async () => {
  const source = await readFile(new URL("../src/VibeCodingIntro.jsx", import.meta.url), "utf8");

  assert.match(source, /function getOpeningPlaybackPlan\(reducedMotion, transcript = INDEXED_TRANSCRIPT\)/);
  assert.match(source, /getStepPlaybackDuration\(step, getStepLineGroups\(step\.id, transcript\), reducedMotion\)/);
  assert.match(source, /getOpeningPlaybackPlan\(reducedMotion, transcript\)/);
});

test("every Chinese content document has a structurally matching English twin", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const manifest = createContentManifest({
    articlesDirectory: path.join(root, "src", "content", "articles"),
    projectsDirectory: path.join(root, "src", "content", "projects"),
  });

  for (const [label, entries] of [["articles", manifest.articles], ["projects", manifest.projects]]) {
    const zhEntries = entries.filter((entry) => entry.locale !== "en");
    const enEntries = entries.filter((entry) => entry.locale === "en");
    const enById = new Map(enEntries.map((entry) => [entry.id, entry]));

    assert.deepEqual(enEntries.map((entry) => entry.id).sort(), zhEntries.map((entry) => entry.id).sort());
    zhEntries.forEach((entry) => {
      const twin = enById.get(entry.id);
      assert.ok(twin, `${label}/${entry.id} is missing its English version`);
      assert.equal(
        twin.headings.length,
        entry.headings.length,
        `${label}/${entry.id} heading count differs between zh and en`,
      );
    });
  }
});
