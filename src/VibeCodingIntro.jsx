import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./vibe-intro.css";

const VIBE_OPENING_STEPS = [
  { id: "boot", duration: 1000, reducedDuration: 90, phase: "boot", preview: "idle", status: "SESSION / INITIALIZING", terminal: "$ vibe --new-session" },
  { id: "brief", duration: 2100, reducedDuration: 140, phase: "bad", preview: "idle", status: "PROMPT / RECEIVED", terminal: "prompt accepted / context 01" },
  { id: "draft", duration: 1600, reducedDuration: 140, phase: "bad", preview: "draft", status: "GENERATING / FIRST PASS", terminal: "feat: generate portfolio shell" },
  { id: "gap", duration: 2100, reducedDuration: 150, phase: "bad", preview: "gap", status: "ISSUE / BACKGROUND GAP", terminal: "fix: make background full width" },
  { id: "scope", duration: 2200, reducedDuration: 150, phase: "bad", preview: "scope", status: "REGRESSION / SCOPE DRIFT", terminal: "warning: layout geometry changed" },
  { id: "panel", duration: 2200, reducedDuration: 150, phase: "bad", preview: "panel", status: "REGRESSION / DEFAULT ADDED", terminal: "fix: restore copy position" },
  { id: "flat", duration: 2200, reducedDuration: 150, phase: "bad", preview: "flat", status: "REGRESSION / HIERARCHY LOST", terminal: "fix: remove copy background" },
  { id: "wrap", duration: 2300, reducedDuration: 160, phase: "bad", preview: "wrap", status: "REGRESSION / COLLATERAL LOSS", terminal: "fix: improve typography" },
  { id: "thesis", duration: 2400, reducedDuration: 220, phase: "thesis", preview: "wrap", status: "PATTERN / DETECTED", terminal: "6 edits / 5 regressions / 0 checkpoints" },
  { id: "promise", duration: 2600, reducedDuration: 240, phase: "thesis", preview: "wrap", status: "WORKFLOW / INTERRUPTED", terminal: "proposal: constrain -> checkpoint -> verify" },
  { id: "clear", duration: 1500, reducedDuration: 120, phase: "repair", preview: "wrap", status: "TERMINAL / CLEAR BUFFER", terminal: "$ clear", command: "clear", commandLabel: "清空错误输出", terminalEffect: "clear" },
  { id: "revert", duration: 2200, reducedDuration: 180, phase: "repair", preview: "wrap", status: "TERMINAL / AWAITING COMMAND", terminal: "$ revert", command: "revert", commandLabel: "回到错误链之前" },
  { id: "new-chat", duration: 2800, reducedDuration: 180, phase: "repair", preview: "idle", status: "CHAT / AWAITING COMMAND", terminal: "$ /new", command: "/new", commandLabel: "开启无污染上下文" },
  {
    id: "good-dark",
    duration: 5200,
    reducedDuration: 170,
    phase: "good",
    preview: "good-dark",
    previewCommitText: "[write]  root canvas",
    status: "CONVERSATION 01 / VISUAL BRIEF",
    terminal: "brief accepted / dark foundation",
    playback: { typingDelay: 24, replyDelay: 900, replyLineStagger: 620 },
  },
  {
    id: "good-space",
    duration: 5000,
    reducedDuration: 170,
    phase: "good",
    preview: "good-space",
    previewCommitText: "[write]  SpaceField",
    status: "CONVERSATION 02 / SPACE FIELD",
    terminal: "space field / pointer depth",
    playback: { typingDelay: 24, replyDelay: 880, replyLineStagger: 560 },
  },
  {
    id: "good-profile-research",
    duration: 9800,
    reducedDuration: 230,
    phase: "good",
    preview: "good-space",
    status: "CONVERSATION 03 / RESEARCH",
    terminal: "public work / working style",
    playback: { typingDelay: 22, replyDelay: 1150, replyLineStagger: 820 },
  },
  {
    id: "good-copy-rough",
    duration: 7200,
    reducedDuration: 200,
    phase: "good",
    preview: "good-copy-rough",
    previewCommitText: "[write]  HeroIdentity",
    status: "CONVERSATION 04 / IDENTITY",
    terminal: "identity draft / unstyled",
    playback: { typingDelay: 24, replyDelay: 900, replyLineStagger: 620 },
  },
  {
    id: "good-copy-refined",
    duration: 6900,
    reducedDuration: 200,
    phase: "good",
    preview: "good-copy-refined",
    previewMilestones: [
      { text: "[write]  secondary text", preview: "good-copy-muted" },
      { text: "[write]  type hierarchy", preview: "good-copy-typed" },
      { text: "[write]  acid-lime accents", preview: "good-copy-refined" },
    ],
    status: "CONVERSATION 05 / HIERARCHY",
    terminal: "typography hierarchy / accent",
    playback: { typingDelay: 24, replyDelay: 920, replyLineStagger: 560 },
  },
  {
    id: "good-three-plan",
    duration: 11000,
    reducedDuration: 240,
    phase: "good",
    preview: "good-copy-refined",
    status: "CONVERSATION 06 / SIMULATION",
    terminal: "model / physics / seed contract",
    playback: { typingDelay: 20, replyDelay: 1200, replyLineStagger: 760 },
  },
  {
    id: "good-three",
    duration: 6100,
    reducedDuration: 180,
    phase: "good",
    preview: "good-three",
    previewCommitText: "[write]  ThreeBodyRenderer",
    status: "MODULE / BUILDING",
    terminal: "three.js: physical cycle / fallback verified",
    playback: { firstLineDelay: 520, lineStagger: 360, settleDelay: 700 },
  },
  { id: "rebase", duration: 2500, reducedDuration: 150, phase: "git", preview: "good-three", status: "GIT / REBASE", terminal: "$ git rebase workflow/main" },
  { id: "merge", duration: 2200, reducedDuration: 150, phase: "git", preview: "good-three", status: "GIT / FAST-FORWARD", terminal: "$ git merge --ff-only corrected-home" },
  { id: "push", duration: 2500, reducedDuration: 160, phase: "git", preview: "ready", status: "TERMINAL / AWAITING COMMAND", terminal: "$ git push", command: "git push", commandLabel: "发布正确链路" },
  { id: "push-ready", duration: 2600, reducedDuration: 180, phase: "git", preview: "ready", status: "REMOTE / VERIFIED", terminal: "origin/codex/main-rework  ✓" },
  { id: "publishing", duration: 1700, reducedDuration: 220, phase: "publishing", preview: "ready", status: "LIVE / ENTERING HOMEPAGE", terminal: "deployment complete / handing off live scene" },
];

const STEP_INDEX = Object.fromEntries(VIBE_OPENING_STEPS.map((step, index) => [step.id, index]));
const AFTER_COMMAND_PHASES = new Set(["waiting", "responding", "complete"]);

const CMD_PREFIX = "D:\\portfolio>";

const CMD_TRANSCRIPT = [
  { at: "boot", kind: "stdout", text: "Microsoft Windows [Version 10.0.26100.4946]" },
  { at: "boot", kind: "dim", text: "(c) Microsoft Corporation. All rights reserved." },
  { at: "boot", kind: "blank", text: "" },
  { at: "brief", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"我想写一个个人作品集\"" },
  { at: "brief", kind: "dim", text: "[ack]   需求清楚；先直接生成完整首页，细节后补" },
  { at: "draft", kind: "stdout", text: "[plan]  hero / projects / nav / responsive / polish" },
  { at: "draft", kind: "success", text: "[done]  complete homepage / 12 files changed / 1.6s" },
  { at: "gap", kind: "blank", text: "" },
  { at: "gap", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"背景怎么没铺满？\"" },
  { at: "gap", kind: "dim", text: "[ack]   小问题；铺满背景，顺手统一首屏尺寸" },
  { at: "scope", kind: "stdout", text: "[write] background-size: cover; width: 100vw" },
  { at: "scope", kind: "warn", text: "WARN  scope expanded from background to hero layout" },
  { at: "scope", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"只改背景，字别动。\"" },
  { at: "panel", kind: "stdout", text: "[ack]   明白，马上放回去；顺手补一层可读性底板" },
  { at: "panel", kind: "warn", text: "WARN  unrequested surface introduced behind copy" },
  { at: "panel", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"为什么又给字加了背景？\"" },
  { at: "flat", kind: "stdout", text: "[ack]   已删；顺手统一字号与间距" },
  { at: "flat", kind: "error", text: "ERROR visual hierarchy collapsed: 5 selectors now share one size" },
  { at: "flat", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"排版也乱了。能不能只改我说的？\"" },
  { at: "wrap", kind: "stdout", text: "[ack]   好，一次收尾：重排标题和导航" },
  { at: "wrap", kind: "error", text: "ERROR heading wrapped; project entry removed as collateral edit" },
  { at: "wrap", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"项目入口呢？你到底改了什么？\"" },
  { at: "thesis", kind: "blank", text: "" },
  { at: "thesis", kind: "warn", text: "WARN  6 次催改 / 5 次回归 / 0 个检查点" },
  { at: "promise", kind: "dim", text: "[hint]  别急着发下一句：先约束，再检查，再继续" },
  { at: "clear", kind: "prompt", prefix: CMD_PREFIX, text: "clear" },
  { at: "revert", kind: "prompt", prefix: CMD_PREFIX, text: "revert" },
  { at: "revert", kind: "dim", text: "[resolve] alias -> git revert --no-edit 7f31c42" },
  { at: "revert", kind: "stdout", text: "[codex/main-rework 1c8bd31] Revert \"feat: flatten hero typography\"" },
  { at: "revert", kind: "stdout", text: " 3 files changed, 42 insertions(+), 96 deletions(-)" },
  { at: "revert", kind: "success", text: "[verify] baseline restored / working tree clean" },
  { at: "new-chat", kind: "prompt", prefix: CMD_PREFIX, text: "/new" },
  { at: "new-chat", kind: "stdout", text: "[session] context 01 archived / context 02 created" },
  { at: "new-chat", kind: "dim", text: "[read]    workspace retained / conversational assumptions dropped" },
  { at: "new-chat", kind: "success", text: "[ready]   send task contract: scope / invariants / acceptance / fallback" },
  { at: "good-dark", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"我想写个属于我自己的作品集。请先核对我期望的排版：以暗色调为主，星空和一部分科幻元素作为设计基线；左侧放我的个人介绍，右侧保留一块空间，用来展示星空和之后的其他小设计。\"" },
  { at: "good-dark", kind: "dim", text: "好的，我先把设计记录下来，不急着补满所有内容。" },
  { at: "good-dark", kind: "stdout", text: "[brief]  dark / deep space / restrained science-fiction" },
  { at: "good-dark", kind: "stdout", text: "[layout] identity left / visual breathing room right" },
  { at: "good-dark", kind: "stdout", text: "[guard]  content structure and native scroll remain unchanged" },
  { at: "good-dark", kind: "stdout", text: "[write]  root canvas / black-blue palette tokens" },
  { at: "good-dark", kind: "success", text: "PASS 01  full viewport / no white edge / layout unchanged" },
  { at: "good-space", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"星空背景需要是动态的，并且根据指针位置产生轻微视差。保持运动克制，不要让星点干扰阅读；低动态偏好时回退为静态星空。\"" },
  { at: "good-space", kind: "dim", text: "明白。我会把星空做成独立背景层，只提供空间深度，不改变前景布局。" },
  { at: "good-space", kind: "stdout", text: "[scope]  SpaceField only / HeroIdentity read-only" },
  { at: "good-space", kind: "stdout", text: "[plan]   layered stars / normalized pointer / capped parallax" },
  { at: "good-space", kind: "stdout", text: "[write]  SpaceField / pointer-events:none / DPR cap=2" },
  { at: "good-space", kind: "stdout", text: "[verify] parallax≤12px / hard edge=0 / reduced-motion=static" },
  { at: "good-space", kind: "success", text: "PASS 02  dynamic space layer / layout diff=0" },
  { at: "good-profile-research", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"我的名字叫 Maple。你可以看看我的 GitHub（github.com/Maple127667）和我们之前的交流记录，了解我做过的项目和关注的问题。先不要修改页面：你觉得我是一个怎样的开发者？请先把观察和建议告诉我，我们讨论后再决定主页如何表达。\"" },
  { at: "good-profile-research", kind: "dim", text: "可以。我先看公开项目与这次协作中呈现出的工作方式，不替你推断私人性格。" },
  { at: "good-profile-research", kind: "stdout", text: "[research] Maple127667 / public repositories" },
  { at: "good-profile-research", kind: "stdout", text: "[read] Search Agent / OneAgent / ezmem" },
  { at: "good-profile-research", kind: "stdout", text: "[read] Maimchat / MaiBot-Napcat-Adapter" },
  { at: "good-profile-research", kind: "dim", text: "你不像在寻找一个现成的职业标签，而是在扩大自己能够完成的作品边界。" },
  { at: "good-profile-research", kind: "dim", text: "这些项目横跨证据优先检索、多 Agent 编排、轻量记忆、消息协议与 Live2D 交互。" },
  { at: "good-profile-research", kind: "dim", text: "方向不同，但共同点很清楚：从真实问题出发，把想法推进成能运行、验证和继续维护的系统。" },
  { at: "good-profile-research", kind: "dim", text: "你愿意快速实验，也会反复确认当前修改是否破坏已经成立的部分。" },
  { at: "good-profile-research", kind: "dim", text: "所以我不建议只写“全栈开发者”或“AI 工程师”。" },
  { at: "good-profile-research", kind: "stdout", text: "[recommend] 创意开发者 / AI 应用与 Agent 系统" },
  { at: "good-profile-research", kind: "stdout", text: "[statement] 在 AI、交互与想象力之间，把好奇心变成可以运行、验证、继续生长的作品。" },
  { at: "good-profile-research", kind: "success", text: "你希望保留、弱化或者修正哪些部分？" },
  { at: "good-copy-rough", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"整体方向是对的。但我不想被定义成一个只做 AI 的开发者：AI 和 Agent 是重要的实践方向，我也在意交互、视觉和作品本身的体验。保留好奇、实验、边界和验证，不要写得像简历，也不用把我塑造成一个过于严肃的人。\"" },
  { at: "good-copy-rough", kind: "dim", text: "明白。你的核心不是某一个技术标签，而是持续把感兴趣的想法做成完整作品。" },
  { at: "good-copy-rough", kind: "stdout", text: "[keep]   curiosity / experiments / engineering boundaries" },
  { at: "good-copy-rough", kind: "stdout", text: "[expand] AI systems + interaction + visual experience" },
  { at: "good-copy-rough", kind: "stdout", text: "[guard]  background / right visual space / navigation unchanged" },
  { at: "good-copy-rough", kind: "stdout", text: "[write]  HeroIdentity / content first / neutral styling" },
  { at: "good-copy-rough", kind: "stdout", text: "[copy]   MAPLE / CREATIVE DEVELOPER / 创意开发者" },
  { at: "good-copy-rough", kind: "stdout", text: "[copy]   AI 应用与 Agent 系统 / 交互与产品实验" },
  { at: "good-copy-rough", kind: "success", text: "PASS 03  identity present / visual styling intentionally unresolved" },
  { at: "good-copy-refined", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"现在左侧整段介绍几乎都是白字，字号和字重也太接近，所有信息都在争抢注意力。保留 MAPLE 和核心介绍为白色，把身份与辅助说明淡化为灰色；重新拉开字号、字重和间距，再用酸绿色点亮品牌斜杠、细分隔线与少量状态信息。文字内容、背景、右侧留白和星空都不要改。\"" },
  { at: "good-copy-refined", kind: "dim", text: "明白。问题不是颜色太少，而是所有信息都处在同一个视觉音量上。" },
  { at: "good-copy-refined", kind: "stdout", text: "[guard]   copy / anchors / background / right space unchanged" },
  { at: "good-copy-refined", kind: "stdout", text: "[write]  secondary text -> quiet gray" },
  { at: "good-copy-refined", kind: "stdout", text: "[write]  type hierarchy -> scale / weight / spacing" },
  { at: "good-copy-refined", kind: "stdout", text: "[write]  acid-lime accents -> slash / divider / live state" },
  { at: "good-copy-refined", kind: "stdout", text: "[verify] hierarchy clear / wraps controlled / unauthorized accent=0" },
  { at: "good-copy-refined", kind: "success", text: "PASS 04  visual hierarchy established / collateral diff=0" },
  { at: "good-three-plan", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"右侧星空已经有了，但还缺少属于这个页面的核心视觉。引入 Three.js 构建三维三体系统：使用真实引力计算，不用预设轨道或循环关键帧；寻找来源清晰的行星或小行星模型并提供程序几何体降级；加入 seed 系统，用伪随机初始位置、质量、三维速度和离面动量保证同 seed 可复现。采用固定时间步，支持碰撞、碎裂和重新聚合。透明画布不能遮挡左侧，也不能修改原生滚动。开始前先告诉我模型、物理和种子方案。\"" },
  { at: "good-three-plan", kind: "dim", text: "好的。我先确认来源和模拟方案，暂时不让三体画面出现。" },
  { at: "good-three-plan", kind: "stdout", text: "[research] public celestial models / license / attribution" },
  { at: "good-three-plan", kind: "stdout", text: "[model]    NASA VTAD Bennu GLB / real irregular silhouette" },
  { at: "good-three-plan", kind: "stdout", text: "[fallback] procedural rocky geometry when GLB is unavailable" },
  { at: "good-three-plan", kind: "stdout", text: "[physics]  pairwise Newtonian gravity / 3D / fixed dt=1/120" },
  { at: "good-three-plan", kind: "stdout", text: "[seed]     deterministic PRNG -> mass / position / velocity / z-momentum" },
  { at: "good-three-plan", kind: "stdout", text: "[cycle]    seed+cycle index -> reproducible variation / collision / reassembly" },
  { at: "good-three-plan", kind: "stdout", text: "[render]   alpha canvas / real trails only / DPR cap / ResizeObserver" },
  { at: "good-three-plan", kind: "stdout", text: "[fallback] reduced motion -> quiet cycle / no WebGL -> static space field" },
  { at: "good-three-plan", kind: "stdout", text: "[guard]    HeroIdentity and native scroll remain read-only" },
  { at: "good-three-plan", kind: "success", text: "方案确认。开始构建。" },
  { at: "good-three", kind: "stdout", text: "[install] three" },
  { at: "good-three", kind: "stdout", text: "[fetch]   NASA Bennu GLB" },
  { at: "good-three", kind: "dim", text: "[credit]  NASA Visualization Technology Applications and Development" },
  { at: "good-three", kind: "stdout", text: "[write]   ThreeBodySimulation / fixed-step solver" },
  { at: "good-three", kind: "stdout", text: "[write]   SeededInitialState / deterministic cycle derivation" },
  { at: "good-three", kind: "stdout", text: "[write]   CollisionAndReassembly / procedural fallback" },
  { at: "good-three", kind: "stdout", text: "[write]  ThreeBodyRenderer / transparent responsive canvas" },
  { at: "good-three", kind: "stdout", text: "[verify] same seed=match / different seed=changed / z-motion=present" },
  { at: "good-three", kind: "stdout", text: "[verify] left diff=0 / native scroll untouched / canvas hard edge=0" },
  { at: "good-three", kind: "success", text: "PASS 05  physical three-body cycle running / fallback ready" },
  { at: "rebase", kind: "blank", text: "" },
  { at: "rebase", kind: "prompt", prefix: CMD_PREFIX, text: "git rebase workflow/main" },
  { at: "rebase", kind: "stdout", text: "First, rewinding head to replay your work on top of it..." },
  { at: "rebase", kind: "success", text: "Successfully rebased and updated refs/heads/corrected-home." },
  { at: "merge", kind: "prompt", prefix: CMD_PREFIX, text: "git merge --ff-only corrected-home" },
  { at: "merge", kind: "stdout", text: "Updating 9c42b7a..cd8721f" },
  { at: "merge", kind: "success", text: "Fast-forward" },
  { at: "push", kind: "prompt", prefix: CMD_PREFIX, text: "git push" },
  { at: "push", kind: "stdout", text: "Enumerating objects: 18, done." },
  { at: "push", kind: "stdout", text: "Writing objects: 100% (18/18), 32.41 KiB | 5.20 MiB/s, done." },
  { at: "push", kind: "success", text: "   9c42b7a..cd8721f  codex/main-rework -> codex/main-rework" },
  { at: "push-ready", kind: "success", text: "PASS  remote ref matches local HEAD" },
  { at: "publishing", kind: "blank", text: "" },
  { at: "publishing", kind: "success", text: "[done]  remote verified; entering live homepage" },
];

const INDEXED_TRANSCRIPT = CMD_TRANSCRIPT.map((line, transcriptIndex) => ({ ...line, transcriptIndex }));

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ));

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return undefined;
    const update = () => setReduced(media.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

function BadPortfolioPreview({ variant }) {
  const hidesProject = variant === "wrap";

  return <div className={`vibe-intro__bad-preview bad-portfolio bad-portfolio--${variant}`} aria-hidden="true">
    <div className="bad-portfolio__backdrop" />
    <header className="bad-portfolio__header">
      <span className="bad-portfolio__logo">PORTFOLIO.</span>
      <span className="bad-portfolio__nav">HOME&nbsp;&nbsp; WORK&nbsp;&nbsp; ABOUT</span>
    </header>
    <div className="bad-portfolio__content">
      <p className="bad-portfolio__eyebrow">HELLO / CREATIVE DEVELOPER</p>
      <h2 className="bad-portfolio__title"><span>I make digital</span> <em>experiences.</em></h2>
      <p className="bad-portfolio__copy">设计、开发与 AI 实验。<br />把模糊想法做成可以使用的界面。</p>
      <span className="bad-portfolio__cta">VIEW MY WORK →</span>
    </div>
    <article className={`bad-portfolio__project${hidesProject ? " is-removed" : ""}`}>
      <span className="bad-portfolio__project-index">01</span>
      <div className="bad-portfolio__project-copy"><small>FEATURED PROJECT</small><strong>SEARCH AGENT</strong></div>
    </article>
    <span className={`bad-portfolio__ghost${hidesProject ? " is-visible" : ""}`}>COMPONENT REMOVED</span>
  </div>;
}

function normalizeCommand(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function commandMatches(value, expected) {
  const normalized = normalizeCommand(value);
  if (expected === "revert") return normalized === "revert" || normalized.startsWith("git revert");
  return normalized === expected;
}

function getAppliedTerminalResetIndex(stepIndex, timeline) {
  return VIBE_OPENING_STEPS.reduce((lastIndex, candidate, candidateIndex) => {
    if (candidate.terminalEffect !== "clear") return lastIndex;
    const hasExecuted = candidateIndex < stepIndex
      || (candidateIndex === stepIndex && AFTER_COMMAND_PHASES.has(timeline.phase));
    return hasExecuted ? candidateIndex : lastIndex;
  }, -1);
}

function getPlaybackTiming(reducedMotion) {
  return reducedMotion ? {
    firstLineDelay: 8,
    lineStagger: 8,
    replyLineStagger: 8,
    beforePromptDelay: 8,
    promptStartDelay: 4,
    enterDelay: 12,
    replyDelay: 12,
    settleDelay: 10,
  } : {
    firstLineDelay: 340,
    lineStagger: 190,
    replyLineStagger: 280,
    beforePromptDelay: 280,
    promptStartDelay: 180,
    enterDelay: 150,
    replyDelay: 520,
    settleDelay: 320,
  };
}

function getStepPlaybackTiming(step, reducedMotion) {
  const baseTiming = getPlaybackTiming(reducedMotion);
  if (reducedMotion || !step.playback) return baseTiming;
  return { ...baseTiming, ...step.playback };
}

function getTypingPlan(text, reducedMotion, authoredDelay) {
  const characters = Array.from(text);
  const characterDelay = reducedMotion
    ? 2
    : authoredDelay ?? (characters.length >= 36 ? 28 : characters.length >= 20 ? 38 : 56);
  return { characters, characterDelay };
}

function getStepLineGroups(stepId) {
  const lines = INDEXED_TRANSCRIPT.filter((line) => line.at === stepId);
  let promptOffset = -1;
  lines.forEach((line, index) => {
    if (line.kind === "prompt") promptOffset = index;
  });

  return {
    lines,
    prompt: promptOffset >= 0 ? lines[promptOffset] : null,
    leading: promptOffset >= 0 ? lines.slice(0, promptOffset) : lines,
    trailing: promptOffset >= 0 ? lines.slice(promptOffset + 1) : [],
  };
}

function getProjectedPreview(step, groups, timeline, priorPreview) {
  const revealedLines = [
    ...groups.leading.slice(0, timeline.leadingCount),
    ...groups.trailing.slice(0, timeline.trailingCount),
  ];
  const hasRevealedText = (text) => revealedLines.some((line) => line.text.includes(text));

  if (step.previewMilestones?.length) {
    return step.previewMilestones.reduce(
      (preview, milestone) => (hasRevealedText(milestone.text) ? milestone.preview : preview),
      priorPreview,
    );
  }

  if (step.previewCommitText && !hasRevealedText(step.previewCommitText)) return priorPreview;
  return step.preview;
}

function getStepPlaybackDuration(step, groups, reducedMotion) {
  const timing = getStepPlaybackTiming(step, reducedMotion);
  const promptText = step.command ?? groups.prompt?.text ?? "";
  const typing = getTypingPlan(promptText, reducedMotion, timing.typingDelay);
  let duration = 0;

  if (groups.leading.length) {
    duration += timing.firstLineDelay + Math.max(0, groups.leading.length - 1) * timing.lineStagger;
  }

  if (groups.prompt) {
    duration += groups.leading.length ? timing.beforePromptDelay : timing.promptStartDelay;
    duration += typing.characters.length * typing.characterDelay + timing.enterDelay;
    if (groups.trailing.length) {
      duration += timing.replyDelay + Math.max(0, groups.trailing.length - 1) * timing.replyLineStagger;
    }
  }

  duration += timing.settleDelay;
  const authoredDuration = reducedMotion ? step.reducedDuration : step.duration;
  return Math.max(authoredDuration, duration);
}

function getOpeningPlaybackPlan(reducedMotion) {
  const offsets = [];
  const durations = [];
  let total = 0;

  VIBE_OPENING_STEPS.forEach((step) => {
    offsets.push(total);
    const duration = getStepPlaybackDuration(step, getStepLineGroups(step.id), reducedMotion);
    durations.push(duration);
    total += duration;
  });

  return { durations, offsets, total };
}

function getStepIndexAtPlayhead(playhead, plan) {
  for (let index = plan.offsets.length - 1; index >= 0; index -= 1) {
    if (playhead >= plan.offsets[index]) return index;
  }
  return 0;
}

function getStepPromptMarkers(step, groups, reducedMotion) {
  const timing = getStepPlaybackTiming(step, reducedMotion);
  const typing = getTypingPlan(step.command ?? groups.prompt?.text ?? "", reducedMotion, timing.typingDelay);
  const leadingCompleteAt = groups.leading.length
    ? timing.firstLineDelay + Math.max(0, groups.leading.length - 1) * timing.lineStagger
    : 0;
  const promptStartAt = leadingCompleteAt + (groups.leading.length ? timing.beforePromptDelay : timing.promptStartDelay);
  const typingEndAt = promptStartAt + typing.characters.length * typing.characterDelay;
  const enterEndAt = typingEndAt + timing.enterDelay;

  return { enterEndAt, leadingCompleteAt, promptStartAt, timing, typing, typingEndAt };
}

function projectStepTimeline(step, groups, elapsed, reducedMotion) {
  const { enterEndAt, leadingCompleteAt, promptStartAt, timing, typing, typingEndAt } = getStepPromptMarkers(
    step,
    groups,
    reducedMotion,
  );
  let leadingCount = 0;
  let promptLength = 0;
  let trailingCount = 0;

  if (groups.leading.length && elapsed >= timing.firstLineDelay) {
    leadingCount = Math.min(
      groups.leading.length,
      1 + Math.floor((elapsed - timing.firstLineDelay) / timing.lineStagger),
    );
  }

  if (leadingCount < groups.leading.length) {
    return { phase: "leading", leadingCount, promptLength, trailingCount };
  }

  if (!groups.prompt) {
    return {
      phase: elapsed >= leadingCompleteAt + timing.settleDelay ? "complete" : "leading",
      leadingCount,
      promptLength,
      trailingCount,
    };
  }

  if (elapsed < promptStartAt) {
    return { phase: "leading", leadingCount, promptLength, trailingCount };
  }

  promptLength = Math.min(
    typing.characters.length,
    Math.max(0, Math.floor((elapsed - promptStartAt) / typing.characterDelay)),
  );
  if (elapsed < typingEndAt) {
    return { phase: "typing", leadingCount, promptLength, trailingCount };
  }

  promptLength = typing.characters.length;
  if (elapsed < enterEndAt) {
    return { phase: "entering", leadingCount, promptLength, trailingCount };
  }

  if (!groups.trailing.length) {
    return {
      phase: elapsed >= enterEndAt + timing.settleDelay ? "complete" : "waiting",
      leadingCount,
      promptLength,
      trailingCount,
    };
  }

  const trailingStartAt = enterEndAt + timing.replyDelay;
  if (elapsed < trailingStartAt) {
    return { phase: "waiting", leadingCount, promptLength, trailingCount };
  }

  trailingCount = Math.min(
    groups.trailing.length,
    1 + Math.floor((elapsed - trailingStartAt) / timing.replyLineStagger),
  );
  const trailingCompleteAt = trailingStartAt + Math.max(0, groups.trailing.length - 1) * timing.replyLineStagger;
  return {
    phase: elapsed >= trailingCompleteAt + timing.settleDelay ? "complete" : "responding",
    leadingCount,
    promptLength,
    trailingCount,
  };
}

export function VibeCodingOpening({
  active = true,
  paused = false,
  runKey = 0,
  onComplete,
  chrome,
  hero,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const playbackPlan = useMemo(() => getOpeningPlaybackPlan(reducedMotion), [reducedMotion]);
  const [stepIndex, setStepIndex] = useState(0);
  const [settled, setSettled] = useState(!active);
  const [commandEntry, setCommandEntry] = useState({ key: "", value: "" });
  const [timelineEntry, setTimelineEntry] = useState({
    key: "",
    phase: "idle",
    leadingCount: 0,
    promptLength: 0,
    trailingCount: 0,
  });
  const [commandState, setCommandState] = useState("");
  const completionRef = useRef(false);
  const commandTimerRef = useRef(null);
  const commandTimerTokenRef = useRef(0);
  const timelineEntryRef = useRef(timelineEntry);
  const commandUserOwnedRef = useRef(false);
  const playbackPausedRef = useRef(false);
  const scrollSeekingRef = useRef(false);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const progressOutputRef = useRef(null);
  const playbackFrameRef = useRef(null);
  const playheadRef = useRef(0);
  const stepIndexRef = useRef(0);
  const cmdBufferRef = useRef(null);
  const step = VIBE_OPENING_STEPS[stepIndex] ?? VIBE_OPENING_STEPS[0];
  const currentStepKey = `${runKey}:${step.id}`;
  const isRunning = active && !settled;
  const stepGroups = useMemo(() => getStepLineGroups(step.id), [step.id]);
  const timelineIsCurrent = timelineEntry.key === currentStepKey;
  const projectedTimeline = timelineIsCurrent ? timelineEntry : {
    key: currentStepKey,
    phase: "leading",
    leadingCount: 0,
    promptLength: 0,
    trailingCount: 0,
  };
  const commandIsManual = commandEntry.key === currentStepKey && commandUserOwnedRef.current;
  const timeline = commandIsManual && commandEntry.timeline
    ? { ...commandEntry.timeline, phase: "manual" }
    : projectedTimeline;
  const projectedCommandInput = step.command
    ? Array.from(step.command).slice(0, timeline.promptLength).join("")
    : "";
  const commandInput = commandIsManual ? commandEntry.value : projectedCommandInput;

  const finish = useCallback(() => {
    if (completionRef.current) return;
    const trackTop = trackRef.current
      ? window.scrollY + trackRef.current.getBoundingClientRect().top
      : 0;
    completionRef.current = true;
    window.cancelAnimationFrame(playbackFrameRef.current);
    setSettled(true);
    onComplete?.();
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: trackTop, behavior: "auto" });
    });
  }, [onComplete]);

  const updatePlayhead = useCallback((nextPlayhead) => {
    if (completionRef.current) return;
    const clampedPlayhead = Math.max(0, Math.min(nextPlayhead, playbackPlan.total));
    const progress = playbackPlan.total > 0 ? clampedPlayhead / playbackPlan.total : 1;
    playheadRef.current = clampedPlayhead;
    stageRef.current?.style.setProperty("--vibe-progress", String(progress));
    if (progressOutputRef.current) {
      progressOutputRef.current.textContent = `${String(Math.round(progress * 100)).padStart(3, "0")}%`;
    }

    const nextStepIndex = getStepIndexAtPlayhead(clampedPlayhead, playbackPlan);
    const nextStep = VIBE_OPENING_STEPS[nextStepIndex];
    const nextStepKey = `${runKey}:${nextStep.id}`;
    const nextGroups = getStepLineGroups(nextStep.id);
    const nextTimeline = {
      key: nextStepKey,
      ...projectStepTimeline(
        nextStep,
        nextGroups,
        clampedPlayhead - playbackPlan.offsets[nextStepIndex],
        reducedMotion,
      ),
    };

    if (nextStepIndex !== stepIndexRef.current) {
      window.clearTimeout(commandTimerRef.current);
      commandTimerRef.current = null;
      commandTimerTokenRef.current += 1;
      stepIndexRef.current = nextStepIndex;
      commandUserOwnedRef.current = false;
      playbackPausedRef.current = false;
      setCommandEntry({ key: "", value: "" });
      setCommandState("");
      setStepIndex(nextStepIndex);
    }

    const previousTimeline = timelineEntryRef.current;
    if (
      previousTimeline.key !== nextTimeline.key
      || previousTimeline.phase !== nextTimeline.phase
      || previousTimeline.leadingCount !== nextTimeline.leadingCount
      || previousTimeline.promptLength !== nextTimeline.promptLength
      || previousTimeline.trailingCount !== nextTimeline.trailingCount
    ) {
      timelineEntryRef.current = nextTimeline;
      setTimelineEntry(nextTimeline);
    }

    if (clampedPlayhead >= playbackPlan.total) finish();
  }, [finish, playbackPlan, reducedMotion, runKey]);

  useEffect(() => {
    window.clearTimeout(commandTimerRef.current);
    commandTimerRef.current = null;
    commandTimerTokenRef.current += 1;
    if (!active) {
      setSettled(true);
      return;
    }
    completionRef.current = false;
    window.cancelAnimationFrame(playbackFrameRef.current);
    playheadRef.current = 0;
    stepIndexRef.current = 0;
    playbackPausedRef.current = false;
    scrollSeekingRef.current = false;
    setStepIndex(0);
    commandUserOwnedRef.current = false;
    setCommandEntry({ key: "", value: "" });
    const initialTimeline = { key: "", phase: "idle", leadingCount: 0, promptLength: 0, trailingCount: 0 };
    timelineEntryRef.current = initialTimeline;
    setTimelineEntry(initialTimeline);
    setCommandState("");
    setSettled(false);
    stageRef.current?.style.setProperty("--vibe-progress", "0");
    if (progressOutputRef.current) progressOutputRef.current.textContent = "000%";
  }, [active, playbackPlan.total, runKey]);

  useEffect(() => () => {
    window.cancelAnimationFrame(playbackFrameRef.current);
    window.clearTimeout(commandTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isRunning || paused) return undefined;
    let previousTime = window.performance.now();

    const tick = (currentTime) => {
      const elapsed = Math.max(0, Math.min(64, currentTime - previousTime));
      previousTime = currentTime;
      if (!paused && !playbackPausedRef.current && !scrollSeekingRef.current) {
        updatePlayhead(playheadRef.current + elapsed);
      }
      if (!completionRef.current) playbackFrameRef.current = window.requestAnimationFrame(tick);
    };

    playbackFrameRef.current = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(playbackFrameRef.current);
  }, [isRunning, paused, runKey, updatePlayhead]);

  useEffect(() => {
    if (!isRunning || paused) return undefined;
    let scrollFrame = null;
    let seekEndTimer = null;
    let ignoreWheelScrollUntil = 0;
    let lastScrollY = window.scrollY;

    const getTrackScrollRange = () => {
      const track = trackRef.current;
      return track ? Math.max(1, track.offsetHeight - window.innerHeight) : 1;
    };

    const cancelCommandTakeover = () => {
      const hasPendingCommand = commandTimerRef.current !== null;
      if (!commandUserOwnedRef.current && !hasPendingCommand) return;
      window.clearTimeout(commandTimerRef.current);
      commandTimerRef.current = null;
      commandTimerTokenRef.current += 1;
      commandUserOwnedRef.current = false;
      playbackPausedRef.current = false;
      setCommandEntry({ key: "", value: "" });
      setCommandState("");
    };

    const seekByPixelDelta = (pixelDelta) => {
      if (Math.abs(pixelDelta) < 0.5) return;
      cancelCommandTakeover();
      const track = trackRef.current;
      if (!track || completionRef.current) return;
      scrollSeekingRef.current = true;
      track.dataset.playback = "seeking";
      updatePlayhead(
        playheadRef.current + (pixelDelta / getTrackScrollRange()) * playbackPlan.total,
      );

      window.clearTimeout(seekEndTimer);
      seekEndTimer = window.setTimeout(() => {
        scrollSeekingRef.current = false;
        if (trackRef.current) trackRef.current.dataset.playback = "auto";
      }, 720);
    };

    const readScrollDelta = () => {
      scrollFrame = null;
      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollY;
      lastScrollY = nextScrollY;
      if (window.performance.now() < ignoreWheelScrollUntil) return;
      seekByPixelDelta(scrollDelta);
    };

    const handleWheel = (event) => {
      if (event.ctrlKey || completionRef.current) return;
      const unit = event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
      ignoreWheelScrollUntil = window.performance.now() + 120;
      seekByPixelDelta(event.deltaY * unit);
    };

    const scheduleScrollRead = () => {
      if (scrollFrame !== null) return;
      scrollFrame = window.requestAnimationFrame(readScrollDelta);
    };

    const resetScrollOrigin = () => {
      lastScrollY = window.scrollY;
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("scroll", scheduleScrollRead, { passive: true });
    window.addEventListener("resize", resetScrollOrigin);
    return () => {
      if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame);
      window.clearTimeout(seekEndTimer);
      scrollSeekingRef.current = false;
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", scheduleScrollRead);
      window.removeEventListener("resize", resetScrollOrigin);
    };
  }, [isRunning, paused, playbackPlan.total, updatePlayhead]);

  useEffect(() => {
    const buffer = cmdBufferRef.current;
    if (!buffer) return undefined;
    const frame = window.requestAnimationFrame(() => {
      buffer.scrollTop = buffer.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [commandEntry.value, commandState, stepIndex, timeline.leadingCount, timeline.phase, timeline.promptLength, timeline.trailingCount]);

  const seekToStepIndex = useCallback((targetIndex) => {
    const nextIndex = Math.max(0, Math.min(targetIndex, VIBE_OPENING_STEPS.length - 1));
    updatePlayhead(playbackPlan.offsets[nextIndex] + 1);
  }, [playbackPlan.offsets, updatePlayhead]);

  const acceptCommand = useCallback((submittedStepIndex, expected) => {
    if (submittedStepIndex !== stepIndexRef.current) return;
    const currentIndex = submittedStepIndex;
    const currentStep = VIBE_OPENING_STEPS[currentIndex];
    if (currentStep.command !== expected) return;
    const currentGroups = getStepLineGroups(currentStep.id);
    const responsePlayhead = playbackPlan.offsets[currentIndex]
      + getStepPromptMarkers(currentStep, currentGroups, reducedMotion).enterEndAt;
    const timerToken = commandTimerTokenRef.current + 1;
    commandTimerTokenRef.current = timerToken;
    setCommandState(`accepted:${expected}`);
    window.clearTimeout(commandTimerRef.current);
    commandTimerRef.current = window.setTimeout(() => {
      commandTimerRef.current = null;
      if (
        timerToken !== commandTimerTokenRef.current
        || currentIndex !== stepIndexRef.current
        || completionRef.current
      ) return;
      commandUserOwnedRef.current = false;
      playbackPausedRef.current = false;
      setCommandEntry({ key: "", value: "" });
      updatePlayhead(Math.max(playheadRef.current, responsePlayhead));
    }, reducedMotion ? 20 : 180);
  }, [playbackPlan.offsets, reducedMotion, updatePlayhead]);

  const submitCommand = useCallback((event) => {
    event.preventDefault();
    if (!step.command) return;
    if (!commandMatches(commandInput, step.command)) {
      setCommandState("error");
      return;
    }
    acceptCommand(stepIndex, step.command);
  }, [acceptCommand, commandInput, step.command, stepIndex]);

  const beginRecovery = useCallback(() => {
    if (step.id !== "promise") return;
    window.clearTimeout(commandTimerRef.current);
    commandTimerRef.current = null;
    commandTimerTokenRef.current += 1;
    commandUserOwnedRef.current = false;
    playbackPausedRef.current = false;
    setCommandEntry({ key: "", value: "" });
    setCommandState("");
    seekToStepIndex(STEP_INDEX.clear);
  }, [seekToStepIndex, step.id]);

  const updateStarParallax = useCallback((event) => {
    if (reducedMotion || event.pointerType === "touch") return;
    const stage = stageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const normalizedX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
    const normalizedY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
    stage.style.setProperty("--vibe-star-x", `${(normalizedX * -5).toFixed(2)}px`);
    stage.style.setProperty("--vibe-star-y", `${(normalizedY * -4).toFixed(2)}px`);
    stage.style.setProperty("--vibe-body-x", `${(normalizedX * 32).toFixed(2)}px`);
    stage.style.setProperty("--vibe-body-y", `${(normalizedY * 22).toFixed(2)}px`);
  }, [reducedMotion]);

  const resetStarParallax = useCallback(() => {
    stageRef.current?.style.setProperty("--vibe-star-x", "0px");
    stageRef.current?.style.setProperty("--vibe-star-y", "0px");
    stageRef.current?.style.setProperty("--vibe-body-x", "0px");
    stageRef.current?.style.setProperty("--vibe-body-y", "0px");
  }, []);

  const displayPhase = isRunning ? step.phase : "complete";
  const priorPreview = VIBE_OPENING_STEPS[Math.max(0, stepIndex - 1)]?.preview ?? step.preview;
  const displayPreview = isRunning
    ? getProjectedPreview(step, stepGroups, timeline, priorPreview)
    : "ready";
  const thesisVisible = step.id === "thesis" || step.id === "promise";
  const thesisMode = step.id === "thesis" ? "thesis" : "promise";
  const terminalResetIndex = getAppliedTerminalResetIndex(stepIndex, timeline);
  const currentStepWasCleared = terminalResetIndex === stepIndex;
  const historyLines = INDEXED_TRANSCRIPT.filter((line) => {
    const lineStepIndex = STEP_INDEX[line.at];
    return lineStepIndex > terminalResetIndex && lineStepIndex < stepIndex;
  });
  const visibleLeading = currentStepWasCleared ? [] : stepGroups.leading.slice(0, timeline.leadingCount);
  const visibleTrailing = currentStepWasCleared ? [] : stepGroups.trailing.slice(0, timeline.trailingCount);
  const promptHasStarted = !currentStepWasCleared
    && Boolean(stepGroups.prompt)
    && timeline.phase !== "leading"
    && timeline.phase !== "idle";
  const promptIsEditable = Boolean(step.command) && ["typing", "entering", "manual"].includes(timeline.phase);
  const promptText = stepGroups.prompt
    ? Array.from(stepGroups.prompt.text).slice(0, timeline.promptLength).join("")
    : "";

  const renderCmdLine = (line, options = {}) => <p
    className={`vibe-intro__cmd-line vibe-intro__cmd-line--${line.kind}${options.className ?? ""}`}
    data-typing-state={options.typingState}
    key={`${line.at}-${line.kind}-${line.transcriptIndex}-${options.keySuffix ?? "line"}`}
    aria-hidden={line.kind === "blank" || options.ariaHidden ? "true" : undefined}
  >
    {line.prefix && <span className="vibe-intro__cmd-prefix">{line.prefix}</span>}
    {line.prefix && " "}{line.kind === "blank" ? "\u00a0" : options.text ?? line.text}
  </p>;

  return <div
    ref={trackRef}
    className="opening-scroll-track"
    data-track-active={isRunning ? "true" : "false"}
  >
    <div
      ref={stageRef}
      className={`opening-stage${isRunning ? " is-running" : " is-complete"}`}
      data-intro-active={isRunning ? "true" : "false"}
      data-phase={displayPhase}
      data-preview={displayPreview}
      data-step={isRunning ? step.id : "complete"}
      onPointerMove={updateStarParallax}
      onPointerLeave={resetStarParallax}
    >
    <div className="opening-stage__chrome" aria-hidden={isRunning ? "true" : undefined} inert={isRunning ? true : undefined}>{chrome}</div>
    <div className="opening-stage__hero-viewport">
      <div className="opening-stage__hero-scale" aria-hidden={isRunning ? "true" : undefined} inert={isRunning ? true : undefined}>{hero}</div>
      {isRunning && <BadPortfolioPreview variant={displayPreview} />}
      {isRunning && <p className="vibe-intro__preview-label">
        <span className="vibe-intro__preview-dot" aria-hidden="true" />
        <span className="vibe-intro__preview-prefix">LIVE DOM PREVIEW / </span>
        <span className="vibe-intro__preview-state" key={displayPreview}>{displayPreview.toUpperCase()}</span>
      </p>}
    </div>

    {isRunning && <div className="vibe-intro" role="region" aria-label="Vibe Coding 开场演示">
      <span className="vibe-intro__progress" aria-hidden="true" />
      <p className="vibe-intro__scroll-status" aria-hidden="true">
        <span>AUTO PLAY / SCROLL TO SCRUB</span>
        <strong ref={progressOutputRef}>000%</strong>
      </p>
      <header className="vibe-intro__topbar">
        <p className="vibe-intro__brand">MAPLE <i aria-hidden="true">/</i> VIBE WORKBENCH</p>
      </header>
      <button className="vibe-intro__skip" type="button" onClick={finish}>Skip</button>

      <aside
        className="vibe-intro__conversation"
        aria-label="Vibe Coding CMD 记录"
        data-typing-state={timeline.phase}
      >
        <div className="vibe-intro__cmd-titlebar">
          <p>Command Prompt</p>
        </div>
        <div ref={cmdBufferRef} className="vibe-intro__cmd-buffer" role="log" aria-live="polite" aria-relevant="additions text">
          {historyLines.map((line) => renderCmdLine(line))}
          {visibleLeading.map((line, index) => renderCmdLine(line, {
            className: timeline.phase === "leading" && index === visibleLeading.length - 1 ? " is-revealing" : "",
            keySuffix: `leading-${index}`,
          }))}

          {promptHasStarted && (promptIsEditable ? <form
            className={`vibe-intro__cmd-prompt${timeline.phase === "typing" ? " is-typing" : timeline.phase === "entering" ? " is-entering" : ""}`}
            data-typing-state={timeline.phase}
            style={{ "--cmd-input-columns": Array.from(commandInput).length }}
            onSubmit={submitCommand}
          >
            <span className="vibe-intro__cmd-prefix" aria-hidden="true">{CMD_PREFIX}</span>
            <input
              className="vibe-intro__cmd-input"
              value={commandInput}
              onChange={(event) => {
                commandUserOwnedRef.current = true;
                playbackPausedRef.current = true;
                setCommandEntry({
                  key: currentStepKey,
                  value: event.target.value,
                  timeline: {
                    ...projectedTimeline,
                    key: currentStepKey,
                    promptLength: Array.from(event.target.value).length,
                  },
                });
                setCommandState("");
              }}
              autoComplete="off"
              spellCheck="false"
              aria-label={`输入演示命令：${step.command}`}
            />
            <button className="vibe-intro__cmd-submit sr-only" type="submit">运行命令</button>
          </form> : renderCmdLine(stepGroups.prompt, {
            className: timeline.phase === "typing" ? " is-typing" : timeline.phase === "entering" ? " is-entering" : "",
            typingState: timeline.phase,
            text: step.command ? commandInput : promptText,
            ariaHidden: ["typing", "entering"].includes(timeline.phase),
            keySuffix: ["typing", "entering"].includes(timeline.phase) ? "typing" : "committed",
          }))}

          {!currentStepWasCleared && commandState === "error" && <p className="vibe-intro__cmd-line vibe-intro__cmd-line--error" role="alert">ERROR unknown demo command; expected {step.command}</p>}

          {visibleTrailing.map((line, index) => renderCmdLine(line, {
            className: timeline.phase === "responding" && index === visibleTrailing.length - 1 ? " is-revealing" : "",
            keySuffix: `trailing-${index}`,
          }))}
        </div>
      </aside>

      <div
        className="vibe-intro__thesis"
        data-visible={thesisVisible ? "true" : "false"}
        aria-hidden={thesisVisible ? undefined : "true"}
        aria-live={thesisVisible ? "polite" : "off"}
      >
        <div className="vibe-intro__thesis-copy" key={thesisMode}>
          {thesisMode === "thesis" ? <>
            <p>你是否厌倦了</p>
            <strong>无止境的无效交流？</strong>
          </> : <>
            <p>约束、检查点、验证 无需考虑</p>
            <strong>我帮你<br />把<span className="vibe-intro__thesis-accent">想法</span>变成<span className="vibe-intro__thesis-accent">项目</span></strong>
            <button
              className="vibe-intro__thesis-action"
              type="button"
              onClick={beginRecovery}
              aria-label="执行 clear、revert 和 /new，继续演示"
            >
              <span className="vibe-intro__thesis-prompt" aria-hidden="true">D:\portfolio&gt;</span>
              <code>clear &amp;&amp; revert &amp;&amp; /new</code>
              <span className="vibe-intro__thesis-enter" aria-hidden="true">ENTER ↵</span>
            </button>
          </>}
        </div>
      </div>
    </div>}
    </div>
  </div>;
}
