import { useEffect, useRef, useState } from "react";
import "./vibe-boot.css";

const MIN_VISIBLE_MS = 1100;
const FONT_TIMEOUT_MS = 1500;
const FAILSAFE_TIMEOUT_MS = 8000;
const EXIT_DELAY_MS = 190;

export function VibeBootLoader({
  ready = false,
  status = "LOADING SPACE RUNTIME",
  onComplete,
  onTimeout,
}) {
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [phase, setPhase] = useState("loading");
  const [displayedProgress, setDisplayedProgress] = useState(0);
  const completedRef = useRef(false);
  const displayedProgressRef = useRef(0);

  const reachedBufferTarget = displayedProgress >= 0.949;
  const targetProgress = reachedBufferTarget && (timedOut || ready && fontsReady) ? 1 : 0.95;

  useEffect(() => {
    let cancelled = false;
    const minimumTimer = window.setTimeout(() => setMinimumElapsed(true), MIN_VISIBLE_MS);
    const failsafeTimer = window.setTimeout(() => {
      setTimedOut(true);
      onTimeout?.();
    }, FAILSAFE_TIMEOUT_MS);
    const fontTimer = window.setTimeout(() => setFontsReady(true), FONT_TIMEOUT_MS);
    const fontSet = document.fonts;

    if (!fontSet?.load) {
      setFontsReady(true);
    } else {
      Promise.allSettled([
        fontSet.load('600 1em "Inter Variable"'),
        fontSet.load('400 1em "Bebas Neue"'),
      ]).then(() => {
        if (cancelled) return;
        window.clearTimeout(fontTimer);
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
    if (!ready || !fontsReady || !minimumElapsed || displayedProgress < 0.999) return undefined;
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
  const compatibilityMode = status.includes("COMPATIBILITY MODE");
  const stageLabel = ready && fontsReady
    ? displayedProgress < 0.999
      ? compatibilityMode ? "FINALIZING COMPATIBILITY MODE" : "FINALIZING SPACE SCENE"
      : compatibilityMode ? status : "READY"
    : timedOut ? "LOCKING COMPATIBILITY MODE" : status;

  return <div
    className="vibe-boot"
    data-phase={phase}
    aria-busy={phase !== "ready"}
    style={{ "--boot-progress": displayedProgress }}
  >
    <section className="vibe-boot__strip" aria-label="Vibe 启动进度">
      <header className="vibe-boot__header">
        <p>MAPLE <i aria-hidden="true">/</i> VIBE</p>
        <span>STARTUP</span>
      </header>
      <p className="vibe-boot__command"><span>D:\portfolio&gt;</span> vibe --start</p>
      <div
        className="vibe-boot__track"
        role="progressbar"
        aria-label="Vibe 启动进度"
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
