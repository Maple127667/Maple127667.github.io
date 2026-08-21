import { useCallback, useEffect, useRef, useState } from "react";
import "./blog-gateway.css";

export const BLOG_GATEWAY_PHASES = Object.freeze({
  closed: "closed",
  lifted: "lifted",
  revealed: "revealed",
  turning: "turning",
  settling: "settling",
});

const TURN_FALLBACK_MS = 940;
const SETTLE_FALLBACK_MS = 320;
const REDUCED_TURN_FALLBACK_MS = 48;
const REDUCED_SETTLE_FALLBACK_MS = 48;
const WHEEL_REVEAL_THRESHOLD = 78;
const TOUCH_REVEAL_THRESHOLD = 42;
const LIFTED_IDLE_MS = 2200;
const REVEALED_IDLE_MS = 4200;

const phaseCopy = {
  closed: {
    label: "发现隐藏的博客（第 1/3 步）",
    status: "",
  },
  lifted: {
    label: "再打开一点（第 2/3 步）",
    status: "纸角轻轻翘起。",
  },
  revealed: {
    label: "翻页进入博客（第 3/3 步）",
    status: "下面露出了博客纸页，再按一次即可进入。",
  },
  turning: {
    label: "正在翻页进入博客",
    status: "正在翻页进入博客。",
  },
  settling: {
    label: "博客已经打开",
    status: "博客已经打开。",
  },
};

function readTargetTheme() {
  if (typeof window === "undefined") return "light";

  try {
    const savedTheme = window.localStorage.getItem("maple-blog-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    // The target can still follow the system theme when storage is unavailable.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window !== "undefined"
      && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
  ));

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return undefined;

    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

function isAtDocumentBottom() {
  const root = document.documentElement;
  const body = document.body;
  const scrollHeight = Math.max(root?.scrollHeight ?? 0, body?.scrollHeight ?? 0);
  return window.scrollY + window.innerHeight >= scrollHeight - 2;
}

function assignRef(ref, value) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

/**
 * Three-step, intentionally discreet entrance from the portfolio to `/blog`.
 *
 * Keep this component mounted while `turning` and `settling`, including after
 * `onEnter` swaps the route. `onTransitionChange(active, phase)` lets the parent
 * retain it outside mutually exclusive page branches and lock background input.
 */
export function BlogCornerGateway({
  active = true,
  onPrime,
  onEnter,
  onTransitionChange,
  triggerRef,
  targetTheme,
  className = "",
}) {
  const [phase, setPhase] = useState(BLOG_GATEWAY_PHASES.closed);
  const [resolvedTheme, setResolvedTheme] = useState(() => targetTheme ?? readTargetTheme());
  const reducedMotion = useReducedMotion();
  const phaseRef = useRef(phase);
  const primedRef = useRef(false);
  const entryStartedRef = useRef(false);
  const triggerNodeRef = useRef(null);
  const routeFramesRef = useRef([]);

  phaseRef.current = phase;

  const setTriggerNode = useCallback((node) => {
    triggerNodeRef.current = node;
    assignRef(triggerRef, node);
  }, [triggerRef]);

  const prime = useCallback(() => {
    if (primedRef.current) return;
    primedRef.current = true;

    try {
      const result = onPrime?.();
      result?.catch?.(() => {});
    } catch {
      // Priming is best effort; the normal route load remains available.
    }
  }, [onPrime]);

  const revealFromOverscroll = useCallback(() => {
    setPhase((current) => {
      if (current === BLOG_GATEWAY_PHASES.turning || current === BLOG_GATEWAY_PHASES.settling) {
        return current;
      }
      return BLOG_GATEWAY_PHASES.revealed;
    });
  }, []);

  const finishSettling = useCallback(() => {
    if (phaseRef.current !== BLOG_GATEWAY_PHASES.settling) return;
    entryStartedRef.current = false;
    setPhase(BLOG_GATEWAY_PHASES.closed);

    const destinationHeading = document.querySelector(".blog-page h1");
    if (!(destinationHeading instanceof HTMLElement)) return;
    const previousTabIndex = destinationHeading.getAttribute("tabindex");
    destinationHeading.setAttribute("tabindex", "-1");
    destinationHeading.focus({ preventScroll: true });
    if (previousTabIndex !== null) {
      destinationHeading.setAttribute("tabindex", previousTabIndex);
      return;
    }
    destinationHeading.addEventListener("blur", () => {
      destinationHeading.removeAttribute("tabindex");
    }, { once: true });
  }, []);

  const finishTurn = useCallback(async () => {
    if (phaseRef.current !== BLOG_GATEWAY_PHASES.turning || entryStartedRef.current) return;
    entryStartedRef.current = true;

    try {
      await onEnter?.();
    } catch {
      entryStartedRef.current = false;
      setPhase(BLOG_GATEWAY_PHASES.revealed);
      return;
    }

    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => {
        routeFramesRef.current = [];
        if (phaseRef.current === BLOG_GATEWAY_PHASES.turning) {
          setPhase(BLOG_GATEWAY_PHASES.settling);
        }
      });
      routeFramesRef.current.push(secondFrame);
    });
    routeFramesRef.current.push(firstFrame);
  }, [onEnter]);

  const advance = useCallback(() => {
    if (!active) return;
    prime();

    setPhase((current) => {
      if (current === BLOG_GATEWAY_PHASES.closed) return BLOG_GATEWAY_PHASES.lifted;
      if (current === BLOG_GATEWAY_PHASES.lifted) return BLOG_GATEWAY_PHASES.revealed;
      if (current === BLOG_GATEWAY_PHASES.revealed) return BLOG_GATEWAY_PHASES.turning;
      return current;
    });
  }, [active, prime]);

  const handleSheetAnimationEnd = useCallback((event) => {
    if (event.target !== event.currentTarget) return;
    if (phaseRef.current === BLOG_GATEWAY_PHASES.turning) {
      void finishTurn();
    } else if (phaseRef.current === BLOG_GATEWAY_PHASES.settling) {
      finishSettling();
    }
  }, [finishSettling, finishTurn]);

  useEffect(() => {
    if (active) prime();
  }, [active, prime]);

  useEffect(() => {
    if (active && targetTheme !== "light" && targetTheme !== "dark") {
      setResolvedTheme(readTargetTheme());
    }
  }, [active, targetTheme]);

  useEffect(() => {
    const transitionActive = phase === BLOG_GATEWAY_PHASES.turning
      || phase === BLOG_GATEWAY_PHASES.settling;
    onTransitionChange?.(transitionActive, phase);
  }, [onTransitionChange, phase]);

  useEffect(() => {
    if (active) return;
    if (phaseRef.current === BLOG_GATEWAY_PHASES.turning
      || phaseRef.current === BLOG_GATEWAY_PHASES.settling) return;
    setPhase(BLOG_GATEWAY_PHASES.closed);
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;

    let wheelDistance = 0;
    let wheelResetTimer = 0;
    let touchStartY = null;

    const resetWheel = () => {
      wheelDistance = 0;
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = 0;
    };

    const onWheel = (event) => {
      const current = phaseRef.current;
      if (current === BLOG_GATEWAY_PHASES.revealed
        || current === BLOG_GATEWAY_PHASES.turning
        || current === BLOG_GATEWAY_PHASES.settling
        || event.ctrlKey
        || Math.abs(event.deltaX) > Math.abs(event.deltaY)
        || event.deltaY <= 0
        || !isAtDocumentBottom()) {
        resetWheel();
        return;
      }

      const pixelDelta = event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaMode === 2 ? event.deltaY * window.innerHeight : event.deltaY;
      wheelDistance += Math.min(pixelDelta, 48);
      window.clearTimeout(wheelResetTimer);
      wheelResetTimer = window.setTimeout(resetWheel, 180);
      if (wheelDistance >= WHEEL_REVEAL_THRESHOLD) {
        resetWheel();
        revealFromOverscroll();
      }
    };

    const onTouchStart = (event) => {
      touchStartY = event.touches.length === 1 && isAtDocumentBottom()
        ? event.touches[0].clientY
        : null;
    };

    const onTouchMove = (event) => {
      const current = phaseRef.current;
      if (touchStartY === null
        || current === BLOG_GATEWAY_PHASES.revealed
        || current === BLOG_GATEWAY_PHASES.turning
        || current === BLOG_GATEWAY_PHASES.settling
        || event.touches.length !== 1) return;

      if (touchStartY - event.touches[0].clientY >= TOUCH_REVEAL_THRESHOLD) {
        touchStartY = null;
        revealFromOverscroll();
      }
    };

    const resetTouch = () => {
      touchStartY = null;
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", resetTouch, { passive: true });
    window.addEventListener("touchcancel", resetTouch, { passive: true });

    return () => {
      resetWheel();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", resetTouch);
      window.removeEventListener("touchcancel", resetTouch);
    };
  }, [active, revealFromOverscroll]);

  useEffect(() => {
    if (!active
      || (phase !== BLOG_GATEWAY_PHASES.lifted && phase !== BLOG_GATEWAY_PHASES.revealed)) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setPhase(BLOG_GATEWAY_PHASES.closed);
      triggerNodeRef.current?.focus({ preventScroll: true });
    };
    const onPointerDown = (event) => {
      if (event.target instanceof Node && triggerNodeRef.current?.contains(event.target)) return;
      setPhase((current) => {
        if (current === BLOG_GATEWAY_PHASES.revealed) return BLOG_GATEWAY_PHASES.lifted;
        if (current === BLOG_GATEWAY_PHASES.lifted) return BLOG_GATEWAY_PHASES.closed;
        return current;
      });
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [active, phase]);

  useEffect(() => {
    if (!active
      || (phase !== BLOG_GATEWAY_PHASES.lifted && phase !== BLOG_GATEWAY_PHASES.revealed)) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      if (phaseRef.current === phase) setPhase(BLOG_GATEWAY_PHASES.closed);
    }, phase === BLOG_GATEWAY_PHASES.lifted ? LIFTED_IDLE_MS : REVEALED_IDLE_MS);
    return () => window.clearTimeout(timeout);
  }, [active, phase]);

  useEffect(() => {
    if (phase !== BLOG_GATEWAY_PHASES.turning) return undefined;
    const timeout = window.setTimeout(
      () => void finishTurn(),
      reducedMotion ? REDUCED_TURN_FALLBACK_MS : TURN_FALLBACK_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [finishTurn, phase, reducedMotion]);

  useEffect(() => {
    if (phase !== BLOG_GATEWAY_PHASES.settling) return undefined;
    const timeout = window.setTimeout(
      finishSettling,
      reducedMotion ? REDUCED_SETTLE_FALLBACK_MS : SETTLE_FALLBACK_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [finishSettling, phase, reducedMotion]);

  useEffect(() => () => {
    routeFramesRef.current.forEach((frame) => window.cancelAnimationFrame(frame));
    routeFramesRef.current = [];
    assignRef(triggerRef, null);
  }, [triggerRef]);

  const copy = phaseCopy[phase];
  const transitionActive = phase === BLOG_GATEWAY_PHASES.turning
    || phase === BLOG_GATEWAY_PHASES.settling;
  const theme = targetTheme === "light" || targetTheme === "dark" ? targetTheme : resolvedTheme;

  return <div
    className={`blog-gateway${className ? ` ${className}` : ""}`}
    data-active={active ? "true" : "false"}
    data-motion={reducedMotion ? "reduced" : "full"}
    data-phase={phase}
    data-target-theme={theme}
  >
    <div id="blog-gateway-sheet" className="blog-gateway__underpage" aria-hidden="true" />
    <div
      className="blog-gateway__turn-sheet"
      aria-hidden="true"
      onAnimationEnd={handleSheetAnimationEnd}
    />
    <button
      ref={setTriggerNode}
      className="blog-gateway__trigger"
      type="button"
      aria-label={copy.label}
      aria-controls="blog-gateway-sheet"
      aria-describedby="blog-gateway-status"
      aria-expanded={phase !== BLOG_GATEWAY_PHASES.closed && phase !== BLOG_GATEWAY_PHASES.lifted}
      aria-busy={transitionActive ? "true" : undefined}
      disabled={!active || transitionActive}
      onClick={advance}
      onFocus={prime}
      onPointerEnter={prime}
      onTouchStart={prime}
    />
    <span className="blog-gateway__fold" aria-hidden="true" />
    <span id="blog-gateway-status" className="blog-gateway__sr" role="status" aria-live="polite">
      {copy.status}
    </span>
  </div>;
}

export default BlogCornerGateway;
