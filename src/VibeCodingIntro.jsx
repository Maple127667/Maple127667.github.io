import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./vibe-intro.css";

const BAD_PREVIEWS = new Set(["draft", "gap", "scope", "panel", "flat", "wrap"]);

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
  { id: "revert", duration: 2200, reducedDuration: 180, phase: "repair", preview: "wrap", status: "TERMINAL / AWAITING COMMAND", terminal: "$ revert", command: "revert", commandLabel: "回到错误链之前" },
  { id: "new-chat", duration: 2800, reducedDuration: 180, phase: "repair", preview: "idle", status: "CHAT / AWAITING COMMAND", terminal: "$ /new", command: "/new", commandLabel: "开启无污染上下文" },
  { id: "good-dark", duration: 2300, reducedDuration: 150, phase: "good", preview: "good-dark", status: "CONSTRAINT 01 / PALETTE", terminal: "checkpoint 01: dark foundation" },
  { id: "good-space", duration: 2100, reducedDuration: 140, phase: "good", preview: "good-space", status: "CONSTRAINT 02 / BACKGROUND", terminal: "checkpoint 02: pointer-responsive depth" },
  { id: "good-copy", duration: 2200, reducedDuration: 140, phase: "good", preview: "good-copy", status: "CONSTRAINT 03 / COPY LOCK", terminal: "checkpoint 03: left copy preserved" },
  { id: "good-acid", duration: 2300, reducedDuration: 140, phase: "good", preview: "good-acid", status: "CONSTRAINT 04 / ACCENT", terminal: "checkpoint 04: acid lime reserved" },
  { id: "good-three", duration: 3000, reducedDuration: 140, phase: "good", preview: "good-three", status: "OPTIONAL MODULE / READY", terminal: "three.js: module queued / fallback verified" },
  { id: "rebase", duration: 2500, reducedDuration: 150, phase: "git", preview: "good-three", status: "GIT / REBASE", terminal: "$ git rebase workflow/main" },
  { id: "merge", duration: 2200, reducedDuration: 150, phase: "git", preview: "good-three", status: "GIT / FAST-FORWARD", terminal: "$ git merge --ff-only corrected-home" },
  { id: "push", duration: 2500, reducedDuration: 160, phase: "git", preview: "ready", status: "TERMINAL / AWAITING COMMAND", terminal: "$ git push", command: "git push", commandLabel: "发布正确链路" },
  { id: "push-ready", duration: 2600, reducedDuration: 180, phase: "git", preview: "ready", status: "REMOTE / VERIFIED", terminal: "origin/codex/main-rework  ✓" },
  { id: "publishing", duration: 1700, reducedDuration: 220, phase: "publishing", preview: "ready", status: "LIVE / ENTERING HOMEPAGE", terminal: "deployment complete / handing off live scene" },
];

const STEP_INDEX = Object.fromEntries(VIBE_OPENING_STEPS.map((step, index) => [step.id, index]));

const CMD_PREFIX = "D:\\portfolio>";

const CMD_TRANSCRIPT = [
  { at: "boot", kind: "stdout", text: "Microsoft Windows [Version 10.0.26100.4946]" },
  { at: "boot", kind: "dim", text: "(c) Microsoft Corporation. All rights reserved." },
  { at: "boot", kind: "blank", text: "" },
  { at: "brief", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"我想写一个个人作品集\"" },
  { at: "brief", kind: "dim", text: "[read]  src/App.jsx, src/styles.css" },
  { at: "draft", kind: "stdout", text: "[write] generated portfolio shell" },
  { at: "draft", kind: "success", text: "[done]  homepage rendered in 1.6s" },
  { at: "gap", kind: "blank", text: "" },
  { at: "gap", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"为什么背景没有填满？\"" },
  { at: "gap", kind: "dim", text: "[read]  hero background bounds" },
  { at: "scope", kind: "stdout", text: "[write] background-size: cover; width: 100vw" },
  { at: "scope", kind: "warn", text: "WARN  scope expanded from background to hero layout" },
  { at: "scope", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"背景填满，但字的位置不要变\"" },
  { at: "panel", kind: "stdout", text: "[write] restored copy position; added readability panel" },
  { at: "panel", kind: "warn", text: "WARN  unrequested surface introduced behind copy" },
  { at: "panel", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"为什么字会有背景？\"" },
  { at: "flat", kind: "stdout", text: "[write] removed panel; normalized typography" },
  { at: "flat", kind: "error", text: "ERROR visual hierarchy collapsed: 5 selectors now share one size" },
  { at: "flat", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"字能不能排版好一点\"" },
  { at: "wrap", kind: "stdout", text: "[write] recomposed headline and navigation" },
  { at: "wrap", kind: "error", text: "ERROR heading wrapped; project entry removed as collateral edit" },
  { at: "thesis", kind: "blank", text: "" },
  { at: "thesis", kind: "warn", text: "WARN  6 edits / 5 regressions / 0 checkpoints" },
  { at: "promise", kind: "dim", text: "hint: constrain -> checkpoint -> verify -> continue" },
  { at: "revert", kind: "prompt", prefix: CMD_PREFIX, text: "revert" },
  { at: "revert", kind: "dim", text: "[alias] git revert --no-edit 7f31c42" },
  { at: "revert", kind: "stdout", text: "[codex/main-rework 1c8bd31] Revert \"feat: flatten hero typography\"" },
  { at: "revert", kind: "stdout", text: " 3 files changed, 42 insertions(+), 96 deletions(-)" },
  { at: "new-chat", kind: "prompt", prefix: CMD_PREFIX, text: "/new" },
  { at: "new-chat", kind: "success", text: "[done]  context 01 closed; clean context 02 ready" },
  { at: "good-dark", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"暗色个人主页；先只建立背景与色彩变量\"" },
  { at: "good-dark", kind: "success", text: "[done]  checkpoint 01 / palette isolated" },
  { at: "good-space", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"加入深空星点；不要改布局\"" },
  { at: "good-space", kind: "success", text: "[done]  checkpoint 02 / background decoupled" },
  { at: "good-copy", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"左侧加入介绍；锁定位置和换行\"" },
  { at: "good-copy", kind: "success", text: "[done]  checkpoint 03 / copy geometry verified" },
  { at: "good-acid", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"酸绿只用于斜杠、状态、关键交互\"" },
  { at: "good-acid", kind: "success", text: "[done]  checkpoint 04 / accent budget passed" },
  { at: "good-three", kind: "prompt", prefix: CMD_PREFIX, text: "vibe \"右侧加入 Three.js 三体；真实物理、随机种子、可降级\"" },
  { at: "good-three", kind: "success", text: "[done]  checkpoint 05 / module + fallback verified" },
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
    {!hidesProject && <article className="bad-portfolio__project">
      <span className="bad-portfolio__project-index">01</span>
      <div className="bad-portfolio__project-copy"><small>FEATURED PROJECT</small><strong>SEARCH AGENT</strong></div>
    </article>}
    {hidesProject && <span className="bad-portfolio__ghost">COMPONENT REMOVED</span>}
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

function clearTimerGroup(timerRef) {
  timerRef.current.forEach((timer) => window.clearTimeout(timer));
  timerRef.current = [];
}

function getPlaybackTiming(reducedMotion) {
  return reducedMotion ? {
    firstLineDelay: 8,
    lineStagger: 8,
    beforePromptDelay: 8,
    promptStartDelay: 4,
    enterDelay: 12,
    replyDelay: 12,
    settleDelay: 10,
  } : {
    firstLineDelay: 340,
    lineStagger: 190,
    beforePromptDelay: 280,
    promptStartDelay: 180,
    enterDelay: 150,
    replyDelay: 520,
    settleDelay: 320,
  };
}

function getTypingPlan(text, reducedMotion) {
  const characters = Array.from(text);
  const characterDelay = reducedMotion ? 2 : characters.length >= 36 ? 28 : characters.length >= 20 ? 38 : 56;
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

function getStepPlaybackDuration(step, groups, reducedMotion) {
  const timing = getPlaybackTiming(reducedMotion);
  const promptText = step.command ?? groups.prompt?.text ?? "";
  const typing = getTypingPlan(promptText, reducedMotion);
  let duration = 0;

  if (groups.leading.length) {
    duration += timing.firstLineDelay + Math.max(0, groups.leading.length - 1) * timing.lineStagger;
  }

  if (groups.prompt) {
    duration += groups.leading.length ? timing.beforePromptDelay : timing.promptStartDelay;
    duration += typing.characters.length * typing.characterDelay + timing.enterDelay;
    if (groups.trailing.length) {
      duration += timing.replyDelay + Math.max(0, groups.trailing.length - 1) * timing.lineStagger;
    }
  }

  duration += timing.settleDelay;
  const authoredDuration = reducedMotion ? step.reducedDuration : step.duration;
  return Math.max(authoredDuration, duration);
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
  const timelineTimersRef = useRef([]);
  const commandUserOwnedRef = useRef(false);
  const cmdBufferRef = useRef(null);
  const step = VIBE_OPENING_STEPS[stepIndex] ?? VIBE_OPENING_STEPS[0];
  const currentStepKey = `${runKey}:${step.id}`;
  const isRunning = active && !settled;
  const stepGroups = useMemo(() => getStepLineGroups(step.id), [step.id]);
  const stepPlaybackDuration = useMemo(
    () => getStepPlaybackDuration(step, stepGroups, reducedMotion),
    [reducedMotion, step, stepGroups],
  );
  const timelineIsCurrent = timelineEntry.key === currentStepKey;
  const timeline = timelineIsCurrent ? timelineEntry : {
    key: currentStepKey,
    phase: "leading",
    leadingCount: 0,
    promptLength: 0,
    trailingCount: 0,
  };
  const commandInput = commandEntry.key === currentStepKey ? commandEntry.value : "";

  const finish = useCallback(() => {
    if (completionRef.current) return;
    completionRef.current = true;
    setSettled(true);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    window.clearTimeout(commandTimerRef.current);
    clearTimerGroup(timelineTimersRef);
    if (!active) {
      setSettled(true);
      return;
    }
    completionRef.current = false;
    setStepIndex(0);
    commandUserOwnedRef.current = false;
    setCommandEntry({ key: "", value: "" });
    setTimelineEntry({ key: "", phase: "idle", leadingCount: 0, promptLength: 0, trailingCount: 0 });
    setCommandState("");
    setSettled(false);
  }, [active, runKey]);

  useEffect(() => () => {
    window.clearTimeout(commandTimerRef.current);
    clearTimerGroup(timelineTimersRef);
  }, []);

  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = window.setTimeout(() => {
      if (stepIndex >= VIBE_OPENING_STEPS.length - 1) {
        finish();
        return;
      }
      setStepIndex((current) => Math.min(current + 1, VIBE_OPENING_STEPS.length - 1));
    }, stepPlaybackDuration);
    return () => window.clearTimeout(timer);
  }, [finish, isRunning, stepPlaybackDuration, stepIndex]);

  useEffect(() => {
    clearTimerGroup(timelineTimersRef);
    commandUserOwnedRef.current = false;
    setCommandState("");
    setCommandEntry({ key: currentStepKey, value: "" });

    if (!isRunning) return undefined;

    const timing = getPlaybackTiming(reducedMotion);
    const promptText = step.command ?? stepGroups.prompt?.text ?? "";
    const typing = getTypingPlan(promptText, reducedMotion);
    const timers = timelineTimersRef.current;
    let leadingCount = 0;
    let promptLength = 0;
    let trailingCount = 0;

    const schedule = (callback, delay) => {
      const timer = window.setTimeout(callback, delay);
      timers.push(timer);
    };
    const updateTimeline = (phase) => setTimelineEntry({
      key: currentStepKey,
      phase,
      leadingCount,
      promptLength,
      trailingCount,
    });
    const finishTimeline = () => updateTimeline("complete");

    const revealTrailing = (index) => {
      trailingCount = index + 1;
      updateTimeline("responding");
      if (trailingCount < stepGroups.trailing.length) {
        schedule(() => revealTrailing(index + 1), timing.lineStagger);
      } else {
        schedule(finishTimeline, timing.settleDelay);
      }
    };

    const waitForReply = () => {
      updateTimeline("waiting");
      if (stepGroups.trailing.length) {
        schedule(() => revealTrailing(0), timing.replyDelay);
      } else {
        schedule(finishTimeline, timing.settleDelay);
      }
    };

    const typePrompt = (index) => {
      if (step.command && commandUserOwnedRef.current) return;
      promptLength = index + 1;
      const finishedTyping = promptLength >= typing.characters.length;
      if (step.command) {
        setCommandEntry({ key: currentStepKey, value: typing.characters.slice(0, promptLength).join("") });
      }
      updateTimeline(finishedTyping ? "entering" : "typing");
      if (finishedTyping) {
        schedule(waitForReply, timing.enterDelay);
      } else {
        schedule(() => typePrompt(index + 1), typing.characterDelay);
      }
    };

    const startPrompt = () => {
      if (!stepGroups.prompt) {
        schedule(finishTimeline, timing.settleDelay);
        return;
      }
      updateTimeline("typing");
      schedule(() => typePrompt(0), typing.characterDelay);
    };

    const afterLeading = () => {
      if (stepGroups.prompt) {
        schedule(startPrompt, stepGroups.leading.length ? timing.beforePromptDelay : timing.promptStartDelay);
      } else {
        schedule(finishTimeline, timing.settleDelay);
      }
    };

    const revealLeading = (index) => {
      leadingCount = index + 1;
      updateTimeline("leading");
      if (leadingCount < stepGroups.leading.length) {
        schedule(() => revealLeading(index + 1), timing.lineStagger);
      } else {
        afterLeading();
      }
    };

    setTimelineEntry({
      key: currentStepKey,
      phase: "leading",
      leadingCount: 0,
      promptLength: 0,
      trailingCount: 0,
    });

    if (stepGroups.leading.length) {
      schedule(() => revealLeading(0), timing.firstLineDelay);
    } else if (stepGroups.prompt) {
      schedule(startPrompt, timing.promptStartDelay);
    } else {
      schedule(finishTimeline, timing.settleDelay);
    }

    return () => clearTimerGroup(timelineTimersRef);
  }, [currentStepKey, isRunning, reducedMotion, step.command, stepGroups]);

  useEffect(() => {
    const buffer = cmdBufferRef.current;
    if (!buffer) return undefined;
    const frame = window.requestAnimationFrame(() => {
      buffer.scrollTop = buffer.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [commandEntry.value, commandState, stepIndex, timeline.leadingCount, timeline.phase, timeline.promptLength, timeline.trailingCount]);

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

  const progress = isRunning ? (stepIndex + 1) / VIBE_OPENING_STEPS.length : 1;
  const showBadPreview = isRunning && BAD_PREVIEWS.has(step.preview);
  const displayPhase = isRunning ? step.phase : "complete";
  const displayPreview = isRunning ? step.preview : "ready";
  const historyLines = INDEXED_TRANSCRIPT.filter((line) => STEP_INDEX[line.at] < stepIndex);
  const visibleLeading = stepGroups.leading.slice(0, timeline.leadingCount);
  const visibleTrailing = stepGroups.trailing.slice(0, timeline.trailingCount);
  const promptHasStarted = Boolean(stepGroups.prompt) && timeline.phase !== "leading" && timeline.phase !== "idle";
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
      </header>
      <button className="vibe-intro__skip" type="button" onClick={finish}>跳过演示 <span aria-hidden="true">↗</span></button>

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
                clearTimerGroup(timelineTimersRef);
                commandUserOwnedRef.current = true;
                setCommandEntry({ key: currentStepKey, value: event.target.value });
                setTimelineEntry((current) => ({
                  ...current,
                  key: currentStepKey,
                  phase: "manual",
                  promptLength: Array.from(event.target.value).length,
                }));
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
            text: step.command ? commandInput || stepGroups.prompt.text : promptText,
            ariaHidden: ["typing", "entering"].includes(timeline.phase),
            keySuffix: ["typing", "entering"].includes(timeline.phase) ? "typing" : "committed",
          }))}

          {commandState === "error" && <p className="vibe-intro__cmd-line vibe-intro__cmd-line--error" role="alert">ERROR unknown demo command; expected {step.command}</p>}

          {visibleTrailing.map((line, index) => renderCmdLine(line, {
            className: timeline.phase === "responding" && index === visibleTrailing.length - 1 ? " is-revealing" : "",
            keySuffix: `trailing-${index}`,
          }))}
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
    </div>}
  </div>;
}
