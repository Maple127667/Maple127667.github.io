import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./vibe-intro.css";

const BAD_PREVIEWS = new Set(["draft", "gap", "scope", "panel", "flat", "wrap"]);

const VIBE_OPENING_STEPS = [
  { id: "boot", duration: 1000, reducedDuration: 90, phase: "boot", preview: "idle", status: "SESSION / INITIALIZING", terminal: "$ vibe --new-session" },
  { id: "brief", duration: 1700, reducedDuration: 140, phase: "bad", preview: "idle", status: "PROMPT / RECEIVED", terminal: "prompt accepted / context 01" },
  { id: "draft", duration: 1600, reducedDuration: 140, phase: "bad", preview: "draft", status: "GENERATING / FIRST PASS", terminal: "feat: generate portfolio shell" },
  { id: "gap", duration: 2100, reducedDuration: 150, phase: "bad", preview: "gap", status: "ISSUE / BACKGROUND GAP", terminal: "fix: make background full width" },
  { id: "scope", duration: 2200, reducedDuration: 150, phase: "bad", preview: "scope", status: "REGRESSION / SCOPE DRIFT", terminal: "warning: layout geometry changed" },
  { id: "panel", duration: 2200, reducedDuration: 150, phase: "bad", preview: "panel", status: "REGRESSION / DEFAULT ADDED", terminal: "fix: restore copy position" },
  { id: "flat", duration: 2200, reducedDuration: 150, phase: "bad", preview: "flat", status: "REGRESSION / HIERARCHY LOST", terminal: "fix: remove copy background" },
  { id: "wrap", duration: 2300, reducedDuration: 160, phase: "bad", preview: "wrap", status: "REGRESSION / COLLATERAL LOSS", terminal: "fix: improve typography" },
  { id: "thesis", duration: 2400, reducedDuration: 220, phase: "thesis", preview: "wrap", status: "PATTERN / DETECTED", terminal: "6 edits / 5 regressions / 0 checkpoints" },
  { id: "promise", duration: 2600, reducedDuration: 240, phase: "thesis", preview: "wrap", status: "WORKFLOW / INTERRUPTED", terminal: "proposal: constrain -> checkpoint -> verify" },
  { id: "revert", duration: 2200, reducedDuration: 180, phase: "repair", preview: "wrap", status: "TERMINAL / AWAITING COMMAND", terminal: "$ revert", command: "revert", commandLabel: "回到错误链之前" },
  { id: "new-chat", duration: 2800, reducedDuration: 180, phase: "repair", preview: "idle", status: "CHAT / AWAITING COMMAND", terminal: "$ /new", command: "/new", commandLabel: "开启无污染上下文" },
  { id: "good-dark", duration: 1800, reducedDuration: 150, phase: "good", preview: "good-dark", status: "CONSTRAINT 01 / PALETTE", terminal: "checkpoint 01: dark foundation" },
  { id: "good-space", duration: 1400, reducedDuration: 140, phase: "good", preview: "good-space", status: "CONSTRAINT 02 / BACKGROUND", terminal: "checkpoint 02: pointer-responsive depth" },
  { id: "good-copy", duration: 1400, reducedDuration: 140, phase: "good", preview: "good-copy", status: "CONSTRAINT 03 / COPY LOCK", terminal: "checkpoint 03: left copy preserved" },
  { id: "good-acid", duration: 1500, reducedDuration: 140, phase: "good", preview: "good-acid", status: "CONSTRAINT 04 / ACCENT", terminal: "checkpoint 04: acid lime reserved" },
  { id: "good-three", duration: 1400, reducedDuration: 140, phase: "good", preview: "good-three", status: "OPTIONAL MODULE / READY", terminal: "three.js: module queued / fallback verified" },
  { id: "rebase", duration: 1800, reducedDuration: 150, phase: "git", preview: "good-three", status: "GIT / REBASE", terminal: "$ git rebase workflow/main" },
  { id: "merge", duration: 1500, reducedDuration: 150, phase: "git", preview: "good-three", status: "GIT / FAST-FORWARD", terminal: "$ git merge --ff-only corrected-home" },
  { id: "push", duration: 1500, reducedDuration: 160, phase: "git", preview: "ready", status: "TERMINAL / AWAITING COMMAND", terminal: "$ git push", command: "git push", commandLabel: "发布正确链路" },
  { id: "push-ready", duration: 2600, reducedDuration: 180, phase: "git", preview: "ready", status: "REMOTE / VERIFIED", terminal: "origin/codex/main-rework  ✓" },
  { id: "publishing", duration: 1700, reducedDuration: 220, phase: "publishing", preview: "ready", status: "LIVE / ENTERING HOMEPAGE", terminal: "deployment complete / handing off live scene" },
];

const STEP_INDEX = Object.fromEntries(VIBE_OPENING_STEPS.map((step, index) => [step.id, index]));

const CONVERSATION = [
  { at: "boot", thread: 1, role: "system", text: "VIBE WORKBENCH / session 01 / no checkpoints" },
  { at: "brief", thread: 1, role: "user", text: "我想写一个个人作品集。" },
  { at: "draft", thread: 1, role: "assistant", text: "好的，我先生成一个看起来完整的主页。" },
  { at: "gap", thread: 1, role: "user", text: "为什么背景没有填满？" },
  { at: "scope", thread: 1, role: "assistant", text: "已经让背景铺满整个页面。" },
  { at: "scope", thread: 1, role: "user", text: "我说的是背景图填满，但是字的位置不变啊。" },
  { at: "panel", thread: 1, role: "assistant", text: "对不起，是我理解错了。我把文字放回原位。" },
  { at: "panel", thread: 1, role: "user", text: "为什么字会有背景？" },
  { at: "flat", thread: 1, role: "assistant", text: "对不起，我默认增加了可读性面板，现在去掉。" },
  { at: "flat", thread: 1, role: "user", text: "字体都一样大，很呆板。字能不能排版好一点？" },
  { at: "wrap", thread: 1, role: "assistant", text: "好的，我会重新组织文字层级。" },
  { at: "wrap", thread: 1, role: "user", text: "为什么标题又分行了？而且我的项目入口呢？" },
  { at: "revert", thread: 1, role: "system", text: "错误示例已停止。请选择一个可恢复的检查点。" },
  { at: "new-chat", thread: 2, role: "system", text: "NEW CONTEXT / clean branch / constraints enabled" },
  { at: "good-dark", thread: 2, role: "user", text: "我想要一个暗色调的个人主页。先只建立背景与色彩变量。" },
  { at: "good-space", thread: 2, role: "user", text: "使用深空星系作为背景，视角跟随鼠标轻微移动；不要改布局。" },
  { at: "good-copy", thread: 2, role: "user", text: "主界面左侧放个人介绍，保留现有内容和位置，完成后检查换行。" },
  { at: "good-acid", thread: 2, role: "user", text: "只使用酸绿色点亮品牌斜杠、状态和关键交互。" },
  { at: "good-three", thread: 2, role: "user", text: "右侧留白加入 Three.js 三体效果；真实物理、随机种子、可降级。" },
  { at: "rebase", thread: 2, role: "assistant", text: "约束全部通过。现在把正确提交整理到一条可审查链路。" },
  { at: "push-ready", thread: 2, role: "assistant", text: "已验证布局、内容与回退状态，可以发布。" },
];

const GIT_NODES = [
  { id: "base", at: "boot", label: "BASE", detail: "main", tone: "neutral" },
  { id: "bad", at: "draft", label: "BAD", detail: "scope drift", tone: "bad" },
  { id: "revert", at: "revert", label: "REVERT", detail: "restore", tone: "bad" },
  { id: "clean", at: "new-chat", label: "NEW", detail: "clean context", tone: "good" },
  { id: "correct", at: "good-acid", label: "GOOD", detail: "checkpoints", tone: "good" },
  { id: "rebase", at: "rebase", label: "REBASE", detail: "linearize", tone: "good" },
  { id: "merge", at: "merge", label: "MERGE", detail: "ff-only", tone: "good" },
  { id: "push", at: "push-ready", label: "PUSH", detail: "origin", tone: "good" },
];

const CONSTRAINTS = [
  { at: "good-dark", label: "暗色基底，不触碰内容" },
  { at: "good-space", label: "背景运动与布局解耦" },
  { at: "good-copy", label: "文案位置与换行锁定" },
  { at: "good-acid", label: "酸绿仅用于关键状态" },
  { at: "good-three", label: "Three.js 可选且可降级" },
];

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
    {!hidesProject && <article className="bad-portfolio__project">
      <span className="bad-portfolio__project-index">01</span>
      <div className="bad-portfolio__project-copy"><small>FEATURED PROJECT</small><strong>SEARCH AGENT</strong></div>
    </article>}
    {hidesProject && <span className="bad-portfolio__ghost">COMPONENT REMOVED</span>}
  </div>;
}

function GitTimeline({ stepIndex }) {
  const activeNode = GIT_NODES.reduce((current, node, index) => (
    stepIndex >= STEP_INDEX[node.at] ? index : current
  ), 0);
  const gitProgress = GIT_NODES.length > 1 ? activeNode / (GIT_NODES.length - 1) : 1;

  return <div className="vibe-intro__git" style={{ "--git-progress": gitProgress }} aria-label="Git 提交链路">
    <span className="vibe-intro__git-line" aria-hidden="true" />
    {GIT_NODES.map((node, index) => {
      const state = index < activeNode ? "is-done" : index === activeNode ? "is-active" : "is-pending";
      return <div className={`git-node ${state} is-${node.tone}`} key={node.id}>
        <span className="git-node__dot" aria-hidden="true" />
        <span className="git-node__copy"><strong>{node.label}</strong><small>{node.detail}</small></span>
      </div>;
    })}
  </div>;
}

function ConstraintList({ stepIndex }) {
  return <ul className="vibe-intro__constraints" aria-label="约束检查">
    {CONSTRAINTS.map((item) => {
      const done = stepIndex >= STEP_INDEX[item.at];
      return <li className={`constraint-check ${done ? "is-done" : "is-pending"}`} key={item.label}>
        <span aria-hidden="true">{done ? "✓" : "·"}</span>{item.label}
      </li>;
    })}
  </ul>;
}

function normalizeCommand(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function commandMatches(value, expected) {
  const normalized = normalizeCommand(value);
  if (expected === "revert") return normalized === "revert" || normalized.startsWith("git revert");
  return normalized === expected;
}

export function VibeCodingOpening({
  active = true,
  runKey = 0,
  onComplete,
  chrome,
  hero,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const [settled, setSettled] = useState(!active);
  const [commandInput, setCommandInput] = useState("");
  const [commandState, setCommandState] = useState("");
  const completionRef = useRef(false);
  const commandTimerRef = useRef(null);
  const step = VIBE_OPENING_STEPS[stepIndex] ?? VIBE_OPENING_STEPS[0];
  const isRunning = active && !settled;

  const finish = useCallback(() => {
    if (completionRef.current) return;
    completionRef.current = true;
    setSettled(true);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!active) {
      setSettled(true);
      return;
    }
    completionRef.current = false;
    setStepIndex(0);
    setCommandInput("");
    setCommandState("");
    setSettled(false);
  }, [active, runKey]);

  useEffect(() => () => window.clearTimeout(commandTimerRef.current), []);

  useEffect(() => {
    if (!isRunning) return undefined;
    const delay = reducedMotion ? step.reducedDuration : step.duration;
    const timer = window.setTimeout(() => {
      if (stepIndex >= VIBE_OPENING_STEPS.length - 1) {
        finish();
        return;
      }
      setStepIndex((current) => Math.min(current + 1, VIBE_OPENING_STEPS.length - 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [finish, isRunning, reducedMotion, step.duration, step.reducedDuration, stepIndex]);

  useEffect(() => {
    setCommandInput("");
    setCommandState("");
  }, [stepIndex]);

  const visibleMessages = useMemo(() => {
    const thread = stepIndex >= STEP_INDEX["new-chat"] ? 2 : 1;
    return CONVERSATION
      .filter((message) => message.thread === thread && STEP_INDEX[message.at] <= stepIndex)
      .slice(-8);
  }, [stepIndex]);

  const advanceFromCommand = useCallback((expected) => {
    const nextIndex = Math.min(stepIndex + 1, VIBE_OPENING_STEPS.length - 1);
    setCommandState(`accepted:${expected}`);
    window.clearTimeout(commandTimerRef.current);
    commandTimerRef.current = window.setTimeout(() => setStepIndex(nextIndex), reducedMotion ? 20 : 180);
  }, [reducedMotion, stepIndex]);

  const submitCommand = useCallback((event) => {
    event.preventDefault();
    if (!step.command) return;
    if (!commandMatches(commandInput, step.command)) {
      setCommandState("error");
      return;
    }
    advanceFromCommand(step.command);
  }, [advanceFromCommand, commandInput, step.command]);

  const useSuggestedCommand = useCallback(() => {
    if (!step.command) return;
    setCommandInput(step.command);
    advanceFromCommand(step.command);
  }, [advanceFromCommand, step.command]);

  const progress = isRunning ? (stepIndex + 1) / VIBE_OPENING_STEPS.length : 1;
  const showBadPreview = isRunning && BAD_PREVIEWS.has(step.preview);
  const displayPhase = isRunning ? step.phase : "complete";
  const displayPreview = isRunning ? step.preview : "ready";

  return <div
    className={`opening-stage${isRunning ? " is-running" : " is-complete"}`}
    data-intro-active={isRunning ? "true" : "false"}
    data-phase={displayPhase}
    data-preview={displayPreview}
    data-step={isRunning ? step.id : "complete"}
    style={{ "--intro-progress": progress, "--vibe-progress": progress }}
  >
    <div className="opening-stage__chrome" aria-hidden={isRunning ? "true" : undefined} inert={isRunning ? true : undefined}>{chrome}</div>
    <div className="opening-stage__hero-viewport">
      <div className="opening-stage__hero-scale" aria-hidden={isRunning ? "true" : undefined} inert={isRunning ? true : undefined}>{hero}</div>
      {showBadPreview && <BadPortfolioPreview variant={step.preview} />}
      {isRunning && <p className="vibe-intro__preview-label"><span aria-hidden="true" /> LIVE DOM PREVIEW / {step.preview.toUpperCase()}</p>}
    </div>

    {isRunning && <div className="vibe-intro" role="region" aria-label="Vibe Coding 开场演示">
      <span className="vibe-intro__progress" aria-hidden="true" />
      <header className="vibe-intro__topbar">
        <p className="vibe-intro__brand">MAPLE <i aria-hidden="true">/</i> VIBE WORKBENCH</p>
        <p className="vibe-intro__status"><span aria-hidden="true" />{step.status}</p>
        <button className="vibe-intro__skip" type="button" onClick={finish}>跳过演示 <span aria-hidden="true">↗</span></button>
      </header>

      <aside className="vibe-intro__conversation" aria-label="提示词对话">
        <div className="vibe-intro__conversation-head">
          <span>CHAT / {stepIndex >= STEP_INDEX["new-chat"] ? "02" : "01"}</span>
          <span>{stepIndex >= STEP_INDEX["new-chat"] ? "CONSTRAINED" : "UNBOUNDED"}</span>
        </div>
        <div className="vibe-intro__messages" aria-live="polite">
          {visibleMessages.map((message, index) => <div
            className={`vibe-message vibe-message--${message.role}${index === visibleMessages.length - 1 ? " is-current" : ""}`}
            key={`${message.at}-${message.role}-${message.text}`}
          >
            <span>{message.role === "user" ? "YOU" : message.role === "assistant" ? "AI" : "SYS"}</span>
            <p>{message.text}</p>
          </div>)}
        </div>
      </aside>

      {(step.phase === "thesis" || step.phase === "repair") && <div className="vibe-intro__thesis" aria-live="polite">
        {step.id === "thesis" ? <>
          <p>你是否厌倦了</p>
          <strong>无止境的无效交流？</strong>
        </> : step.id === "promise" ? <>
          <p>约束、检查点、验证</p>
          <strong>我可以帮你解决这一切。</strong>
        </> : <>
          <p>先恢复，再建立干净上下文</p>
          <strong>错误链不必成为历史。</strong>
        </>}
      </div>}

      <footer className="vibe-intro__terminal">
        <div className="vibe-intro__terminal-head">
          <span>DEMO TERMINAL / SIMULATION ONLY</span>
          <code>{step.terminal}</code>
        </div>
        <GitTimeline stepIndex={stepIndex} />
        {step.command ? <form className="vibe-intro__command-row" onSubmit={submitCommand}>
          <label htmlFor="vibe-command">输入演示命令</label>
          <span aria-hidden="true">$</span>
          <input
            id="vibe-command"
            className="vibe-intro__command-input"
            value={commandInput}
            onChange={(event) => {
              setCommandInput(event.target.value);
              setCommandState("");
            }}
            autoComplete="off"
            spellCheck="false"
            placeholder={step.command}
            aria-describedby="vibe-command-hint"
          />
          <button className="vibe-intro__command-submit" type="submit">执行</button>
          <button className="vibe-intro__hint" id="vibe-command-hint" type="button" onClick={useSuggestedCommand}>{step.commandLabel} / {step.command}</button>
          {commandState === "error" && <em role="alert">命令不匹配；此处期待 {step.command}</em>}
          {commandState.startsWith("accepted:") && <em className="is-accepted">accepted ✓</em>}
        </form> : <ConstraintList stepIndex={stepIndex} />}
      </footer>
    </div>}
  </div>;
}
