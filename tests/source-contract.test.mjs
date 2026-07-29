import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("page progress rail and profile flow stay complete", async () => {
  const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const rail = source.match(/const sectionRailItems\s*=\s*\[([\s\S]*?)\];/)?.[1] ?? "";
  const ids = [...rail.matchAll(/id:\s*["']([^"']+)["']/g)].map((match) => match[1]);

  assert.deepEqual(ids, ["top", "projects", "about", "notes", "contact"]);
  assert.match(source, /href="#about"[^>]*>关于我<\/a>/);
  assert.match(source, /function ProfileSection\(\)/);
  assert.match(source, /from "\.\/content\/profile\.js"/);
  assert.match(source, /from "\.\/content\/projects\/index\.js"/);
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
  assert.match(source, /className="hero__role-cn">创意开发者/);
  assert.match(source, /AI 应用与 Agent 系统/);
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

  assert.match(cssSource, /@fontsource-variable\/inter/);
  assert.doesNotMatch(cssSource, /IBM Plex|ibm-plex|var\(--mono\)/i);
  assert.doesNotMatch(cssSource, /font:\s*(?:10|11|12)px\//);
  assert.doesNotMatch(cssSource, /font-size:\s*(?:10|11|12)px/);
});
test("Chinese flagship project labels use the UI sans stack", async () => {
  const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(cssSource, /--ui:\s*"Inter Variable",\s*Inter,\s*system-ui/);
  assert.match(cssSource, /--code:\s*"Cascadia Code"/);
  assert.match(cssSource, /\.project__kicker\s*\{[^}]*font:\s*500 15px\/1\.5 var\(--ui\)[^}]*letter-spacing:\s*0/);
  assert.match(cssSource, /\.project__status\s*\{[^}]*font:\s*500 14px\/1\.5 var\(--ui\)[^}]*letter-spacing:\s*0/);
  assert.match(cssSource, /\.project__copy \.text-link\s*\{[^}]*font:\s*500 15px\/1\.3 var\(--ui\)[^}]*letter-spacing:\s*0/);
  assert.match(cssSource, /\.site-nav a\s*\{[^}]*font:\s*500 14px\/1\.35 var\(--ui\)[^}]*letter-spacing:\s*0/);
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
  assert.match(sceneSource, /renderer\.setClearColor\(0x000000, 0\)/);
  assert.match(sceneSource, /renderer\.setClearAlpha\(0\)/);
  assert.match(appSource, /requestIdleCallback/);
  assert.doesNotMatch(appSource, /from "three"/);
  assert.match(sceneSource, /from "three"/);
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
test("only Search Agent is promoted as a full-screen project", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /<ProjectSection project=\{projects\[0\]\}/);
  assert.doesNotMatch(appSource, /<ProjectSection project=\{projects\[1\]\}/);
  assert.match(appSource, /<ProjectArchive items=\{projects\.slice\(1\)\}/);
});
test("returning from a reader cannot consume residual scrolling", async () => {
  const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

  assert.match(appSource, /const resumedFromReader = enabled && previousEnabledRef\.current === false/);
  assert.match(appSource, /if \(suppressResumeWheel\)[\s\S]*resumeWheelTimer = window\.setTimeout/);
  assert.match(appSource, /resumeWheelTimer = window\.setTimeout\(\(\) => \{ suppressResumeWheel = false; \}, 900\)/);
  assert.match(appSource, /previousFocus\?\.focus\?\.\(\{ preventScroll: true \}\)/);
  assert.match(appSource, /contentReturnY: returnScrollY/);
  assert.match(appSource, /restoreReaderReturnPosition\(returnScrollY\)/);
  assert.match(appSource, /skipHashRestoreRef\.current = true/);
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
  assert.match(appSource, /project-reader__external/);
  assert.match(searchSource, /github\.com\/Maple127667\/search_agent/);
  assert.match(shianSource, /https:\/\/shian-manual\.top\//);
  assert.match(maibotSource, /github\.com\/Maple127667\/MaiBot/);
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
  const [appSource, cssSource] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(appSource, /function MarkdownContent[\s\S]*article-image-button/);
  assert.match(appSource, /className="image-lightbox"/);
  assert.match(appSource, /aria-label="关闭图片预览"/);
  assert.match(appSource, /window\.addEventListener\("keydown", onKeyDown, true\)/);
  assert.match(appSource, /previousReaderScrollTop[\s\S]*reader\.scrollTo\(\{ top: previousReaderScrollTop, behavior: "auto" \}\)/);
  assert.match(cssSource, /\.image-lightbox\s*\{/);
  assert.match(cssSource, /cursor:\s*zoom-in/);
});
