import { useEffect, useRef, useState } from "react";
import { useLocale } from "./i18n.jsx";
import "./vibe-boot.css";

const MIN_VISIBLE_MS = 1100;
const FONT_TIMEOUT_MS = 1500;
const FAILSAFE_TIMEOUT_MS = 8000;
const EXIT_DELAY_MS = 190;

export function VibeBootLoader({
  ready = false,
  progress = 0,
  status = "LOADING SPACE RUNTIME",
  onComplete,
  onTimeout,
}) {
  const { copy } = useLocale();
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [fontsFallback, setFontsFallback] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [phase, setPhase] = useState("loading");
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const completedRef = useRef(false);
  const readyRef = useRef(ready);
  const displayedProgressRef = useRef(0);

  readyRef.current = ready;

  const verifiedProgress = Math.min(1, Math.max(0, Number(progress) || 0));
  const targetProgress = Math.min(1, verifiedProgress * 0.95 + (fontsReady ? 0.05 : 0));

  useEffect(() => {
    let cancelled = false;
    const minimumTimer = window.setTimeout(() => setMinimumElapsed(true), MIN_VISIBLE_MS);
    const failsafeTimer = window.setTimeout(() => {
      if (readyRef.current || completedRef.current) return;
      setTimedOut(true);
      onTimeout?.();
    }, FAILSAFE_TIMEOUT_MS);
    const fontTimer = window.setTimeout(() => {
      setFontsFallback(true);
      setFontsReady(true);
    }, FONT_TIMEOUT_MS);
    const fontSet = document.fonts;

    if (!fontSet?.load) {
      setFontsReady(true);
    } else {
      Promise.allSettled([
        fontSet.load('600 1em "Inter Variable"'),
        fontSet.load('400 1em "Bebas Neue"'),
      ]).then((outcomes) => {
        if (cancelled) return;
        window.clearTimeout(fontTimer);
        setFontsFallback(outcomes.some((outcome) => outcome.status === "rejected"));
        setFontsReady(true);
      });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(minimumTimer);
      window.clearTimeout(failsafeTimer);
      window.clearTimeout(fontTimer);
    };
  }, [onTimeout]);

  useEffect(() => {
    const from = displayedProgressRef.current;
    if (targetProgress <= from) return undefined;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      displayedProgressRef.current = targetProgress;
      setDisplayedProgress(targetProgress);
      return undefined;
    }

    const distance = targetProgress - from;
    const duration = targetProgress >= 0.999
      ? 360
      : Math.max(900, distance * 1450);
    const startedAt = window.performance.now();
    let frame = 0;
    const tick = (timestamp) => {
      const ratio = Math.min(1, (timestamp - startedAt) / duration);
      const nextProgress = from + distance * ratio;
      displayedProgressRef.current = nextProgress;
      setDisplayedProgress(nextProgress);
      if (ratio < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [targetProgress]);

  useEffect(() => {
    if (!ready || !fontsReady || !minimumElapsed || displayedProgress < 0.999) {
      if (!completedRef.current) setPhase("loading");
      return undefined;
    }
    if (completedRef.current) return undefined;
    setPhase("ready");
    const exitTimer = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete?.();
    }, window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 30 : EXIT_DELAY_MS);
    return () => window.clearTimeout(exitTimer);
  }, [displayedProgress, fontsReady, minimumElapsed, onComplete, ready]);

  const percentage = Math.round(displayedProgress * 100);
  const compatibilityMode = fontsFallback || status.includes("COMPATIBILITY MODE") || status.includes("FALLBACK");
  const settledStatus = fontsFallback ? "READY / SYSTEM FONT FALLBACK" : compatibilityMode ? status : "READY";
  const stageLabel = ready && fontsReady
    ? displayedProgress < 0.999
      ? compatibilityMode ? "FINALIZING COMPATIBILITY MODE" : "FINALIZING SPACE SCENE"
      : settledStatus
    : timedOut ? "LOCKING COMPATIBILITY MODE" : status;

  return <div
    className="vibe-boot"
    data-phase={phase}
    aria-busy={phase !== "ready"}
    style={{ "--boot-progress": displayedProgress }}
  >
    <section className="vibe-boot__strip" aria-label={copy.boot.progressAria}>
      <header className="vibe-boot__header">
        <p>MAPLE <i aria-hidden="true">/</i> VIBE</p>
        <span>STARTUP</span>
      </header>
      <p className="vibe-boot__command"><span>D:\portfolio&gt;</span> vibe --start</p>
      <div
        className="vibe-boot__track"
        role="progressbar"
        aria-label={copy.boot.progressAria}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={percentage}
      ><span aria-hidden="true" /></div>
      <footer className="vibe-boot__meta">
        <span>{stageLabel}</span>
        <output aria-hidden="true">{String(percentage).padStart(3, "0")}%</output>
      </footer>
      <span className="vibe-boot__live" role="status" aria-live="polite">{stageLabel}</span>
    </section>
  </div>;
}
