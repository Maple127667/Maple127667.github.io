import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  GithubLogo,
} from "@phosphor-icons/react";
import {
  collectProjectTechnologies,
  projectTechnologyGroups,
} from "./content/projectTechnologies.js";
import {
  getPortfolioJourneyMetrics,
  PROJECT_FIRST_CENTER_UNITS,
} from "./portfolioJourneyTimeline.js";
import "./portfolio-journey.css";

const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const mix = (from, to, progress) => from + (to - from) * progress;
const smoothstep = (start, end, value) => {
  const progress = clamp((value - start) / Math.max(0.0001, end - start));
  return progress * progress * (3 - 2 * progress);
};
function getRingCardPose(projectIndex, rotationPosition, projectCount, pointerX, pointerY) {
  if (projectCount <= 1) {
    return { x: 0, y: -4, scale: 1.04, opacity: 1, rotate: 0, depth: 1 };
  }
  const angle = Math.PI / 2 + (projectIndex - rotationPosition) * ((Math.PI * 2) / projectCount);
  const horizontal = Math.cos(angle);
  const depth = (Math.sin(angle) + 1) / 2;
  const pitch = mix(12, 42, (pointerY + 1) / 2) * (Math.PI / 180);
  const vertical = -Math.sin(angle) * Math.sin(pitch);
  const rollWeight = pointerX * 10;
  return {
    x: horizontal * 32 * mix(0.9, 1, depth) - vertical * pointerX * 3.8,
    y: vertical * 30 + horizontal * rollWeight + 2,
    scale: 0.62 + depth * 0.42,
    opacity: 0.28 + depth * 0.72,
    rotate: horizontal * -2.6 + pointerX * 1.2,
    depth,
  };
}

function ProjectDestination({ project }) {
  if (!project.link) return null;
  return <a
    className="portfolio-project__external"
    href={project.link.url}
    target="_blank"
    rel="noreferrer"
  >
    {project.link.type === "github"
      ? <GithubLogo size={18} aria-hidden="true" />
      : <ArrowUpRight size={18} aria-hidden="true" />}
    <span>{project.link.label}</span>
  </a>;
}

export function PortfolioJourney({ active, projects, onOpenProject }) {
  const rootRef = useRef(null);
  const stackRef = useRef(null);
  const stackGroupRefs = useRef(new Map());
  const projectPlaneRef = useRef(null);
  const projectRefs = useRef(new Map());
  const activeIndexRef = useRef(-1);
  const stackActiveRef = useRef(false);
  const handoffActiveRef = useRef(false);
  const ringLockedRef = useRef(false);
  const hoveredProjectRef = useRef(null);
  const scheduleMotionRef = useRef(() => {});
  const ringInteractionRef = useRef({
    rotationPosition: 0,
    rotationSpeed: 1,
    paused: false,
    pointerId: null,
    candidate: false,
    dragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    pendingDelta: 0,
    manualVelocity: 0,
    blockClickUntil: 0,
  });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [stackActive, setStackActive] = useState(false);
  const [handoffActive, setHandoffActive] = useState(false);
  const [detailProjectId, setDetailProjectId] = useState(null);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [staticMode, setStaticMode] = useState(() => window.matchMedia(
    "(max-width: 760px), (max-height: 660px), (prefers-reduced-motion: reduce)",
  ).matches);
  const metrics = useMemo(() => getPortfolioJourneyMetrics(projects.length), [projects.length]);
  const uniqueTechnologies = useMemo(() => collectProjectTechnologies(projects), [projects]);

  useEffect(() => {
    const media = window.matchMedia(
      "(max-width: 760px), (max-height: 660px), (prefers-reduced-motion: reduce)",
    );
    const updateMode = () => setStaticMode(media.matches);
    updateMode();
    media.addEventListener?.("change", updateMode);
    return () => media.removeEventListener?.("change", updateMode);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = root?.closest(".opening-scroll-track");
    const stage = root?.closest(".opening-stage");
    if (!root || !track || !stage) return undefined;

    const ringInteraction = ringInteractionRef.current;
    ringInteraction.pointerId = null;
    ringInteraction.candidate = false;
    ringInteraction.dragging = false;
    ringInteraction.pendingDelta = 0;
    projectPlaneRef.current?.removeAttribute("data-dragging");

    const resetMotion = () => {
      stage.style.setProperty("--portfolio-hero-x", "0vw");
      stage.style.setProperty("--portfolio-location-x", "0vw");
      stage.style.setProperty("--portfolio-hero-opacity", "1");
      stage.style.setProperty("--portfolio-rail-opacity", "1");
      stage.style.setProperty("--portfolio-rail-x", "0px");
      stage.style.setProperty("--portfolio-scene-opacity", "1");
      root.style.setProperty("--project-plane-y", "0vh");
      root.style.setProperty("--project-plane-opacity", staticMode ? "1" : "0");
      root.style.setProperty("--stack-opacity", staticMode ? "1" : "0");
      root.style.setProperty("--journey-backdrop-opacity", staticMode ? "1" : "0");
      root.style.setProperty("--journey-heading-opacity", staticMode ? "1" : "0");
      root.style.setProperty("--handoff-opacity", "0");
      root.style.setProperty("--handoff-scale", "0.96");
      root.style.setProperty("--stack-heading-opacity", staticMode ? "1" : "0");
      root.style.setProperty("--stack-heading-y", staticMode ? "0px" : "28px");
      stackGroupRefs.current.forEach((group) => {
        group.style.setProperty("--stack-group-opacity", staticMode ? "1" : "0");
        group.style.setProperty("--stack-group-x", staticMode ? "0px" : "34px");
        group.style.setProperty("--stack-group-y", staticMode ? "0px" : "18px");
        group.style.setProperty("--stack-group-scale", staticMode ? "1" : "0.94");
      });
      root.dataset.ringInteractive = "false";
      root.dataset.handoffActive = "false";
      ringLockedRef.current = false;
    };

    if (!active) {
      resetMotion();
      scheduleMotionRef.current = () => {};
      activeIndexRef.current = -1;
      stackActiveRef.current = false;
      handoffActiveRef.current = false;
      setActiveIndex(-1);
      setStackActive(false);
      setHandoffActive(false);
      return undefined;
    }

    const syncWaypointPositions = (useStaticLayout) => {
      metrics.waypoints.forEach((waypoint) => {
        const element = track.querySelector(`#${waypoint.id}`);
        if (!element) return;
        if (!useStaticLayout) {
          element.style.top = `${waypoint.topVh}svh`;
          return;
        }
        const trackRect = track.getBoundingClientRect();
        const target = waypoint.id === "stack" ? stackRef.current : root;
        if (!target) return;
        element.style.top = `${target.getBoundingClientRect().top - trackRect.top}px`;
      });
    };

    if (staticMode) {
      resetMotion();
      scheduleMotionRef.current = () => {};
      ringInteraction.rotationSpeed = 0;
      ringInteraction.manualVelocity = 0;
      activeIndexRef.current = -1;
      stackActiveRef.current = true;
      handoffActiveRef.current = false;
      setActiveIndex(-1);
      setStackActive(true);
      setHandoffActive(false);
      let staticFrame = window.requestAnimationFrame(() => syncWaypointPositions(true));
      const syncStaticLayout = () => {
        window.cancelAnimationFrame(staticFrame);
        staticFrame = window.requestAnimationFrame(() => syncWaypointPositions(true));
      };
      window.addEventListener("resize", syncStaticLayout);
      const staticResizeObserver = "ResizeObserver" in window
        ? new ResizeObserver(syncStaticLayout)
        : null;
      staticResizeObserver?.observe(root);
      return () => {
        window.cancelAnimationFrame(staticFrame);
        staticResizeObserver?.disconnect();
        window.removeEventListener("resize", syncStaticLayout);
      };
    }

    syncWaypointPositions(false);

    let frame = null;
    let resizeObserver = null;
    let previousFrameTime = performance.now();
    let pointerX = 0;
    let pointerY = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;

    const render = (frameTime = performance.now()) => {
      frame = null;
      const frameDelta = Math.min(0.05, Math.max(0.001, (frameTime - previousFrameTime) / 1000));
      previousFrameTime = frameTime;
      pointerX += (pointerTargetX - pointerX) * (1 - Math.exp(-frameDelta * 6));
      pointerY += (pointerTargetY - pointerY) * (1 - Math.exp(-frameDelta * 6));

      const viewportHeight = Math.max(1, window.innerHeight);
      const rect = track.getBoundingClientRect();
      const scrollUnits = clamp(-rect.top / viewportHeight, 0, metrics.totalUnits);
      const handoffProgress = clamp(
        (scrollUnits - metrics.handoffStart)
          / Math.max(0.0001, metrics.handoffEnd - metrics.handoffStart),
      );
      const interactionWeight = 1 - smoothstep(0.02, 0.18, handoffProgress);
      const ringExpansion = smoothstep(0.08, 0.48, handoffProgress);
      const ringFade = 1 - smoothstep(0.44, 0.68, handoffProgress);
      const handoffIsActive = handoffProgress > 0.001 && handoffProgress < 0.999;
      const ringIsLocked = handoffProgress > 0.02;

      if (ringIsLocked && !ringLockedRef.current) {
        const pointerId = ringInteraction.pointerId;
        if (pointerId !== null && projectPlaneRef.current?.hasPointerCapture?.(pointerId)) {
          projectPlaneRef.current.releasePointerCapture(pointerId);
        }
        ringInteraction.pointerId = null;
        ringInteraction.candidate = false;
        ringInteraction.dragging = false;
        ringInteraction.pendingDelta = 0;
        ringInteraction.manualVelocity = 0;
        projectPlaneRef.current?.removeAttribute("data-dragging");
        hoveredProjectRef.current = null;
        setDetailProjectId(null);
        if (projectPlaneRef.current?.contains(document.activeElement)) {
          document.activeElement.blur?.();
        }
      }
      ringLockedRef.current = ringIsLocked;

      const manualMotionActive = Math.abs(ringInteraction.manualVelocity) > 0.015;
      const automaticRotationBlocked = ringInteraction.paused
        || Boolean(hoveredProjectRef.current)
        || ringInteraction.dragging
        || manualMotionActive
        || interactionWeight <= 0.001;
      const targetRotationSpeed = automaticRotationBlocked ? 0 : interactionWeight;
      ringInteraction.rotationSpeed += (targetRotationSpeed - ringInteraction.rotationSpeed)
        * (1 - Math.exp(-frameDelta * 7));

      const heroExit = smoothstep(0.02, 0.86, scrollUnits);
      const heroCopyFade = 1 - smoothstep(0.3, 0.76, scrollUnits);
      const projectEntrance = smoothstep(0.18, PROJECT_FIRST_CENTER_UNITS, scrollUnits);
      const projectVisibility = projectEntrance * ringFade;
      const projectPlaneVisibility = projectEntrance
        * (1 - smoothstep(0.67, 0.72, handoffProgress));
      const bridgeOpacity = smoothstep(0.3, 0.4, handoffProgress)
        * (1 - smoothstep(0.54, 0.66, handoffProgress));
      const bridgeScaleProgress = smoothstep(0.3, 0.66, handoffProgress);
      const stackReveal = smoothstep(0.48, 0.62, handoffProgress);
      const stackHeadingReveal = smoothstep(0.5, 0.74, handoffProgress);
      const stackIsActive = handoffProgress > 0.9;
      const stageIsVisible = rect.bottom > 0 && rect.top < viewportHeight;

      if (ringInteraction.pendingDelta !== 0) {
        ringInteraction.rotationPosition += ringInteraction.pendingDelta * interactionWeight;
        ringInteraction.pendingDelta = 0;
      }
      if (!ringInteraction.dragging && Math.abs(ringInteraction.manualVelocity) > 0.001) {
        ringInteraction.rotationPosition += ringInteraction.manualVelocity * frameDelta * interactionWeight;
        ringInteraction.manualVelocity *= Math.exp(-frameDelta * mix(5.2, 9.2, 1 - interactionWeight));
        if (Math.abs(ringInteraction.manualVelocity) < 0.004) ringInteraction.manualVelocity = 0;
      }

      const autoCanAdvance = projectEntrance > 0.02
        && interactionWeight > 0.001
        && stageIsVisible
        && !document.hidden
        && !automaticRotationBlocked;
      if (autoCanAdvance) {
        ringInteraction.rotationPosition += frameDelta * 0.19 * ringInteraction.rotationSpeed;
      }
      const projectCount = Math.max(1, projects.length);
      ringInteraction.rotationPosition = (
        (ringInteraction.rotationPosition % projectCount) + projectCount
      ) % projectCount;
      const rotationPosition = ringInteraction.rotationPosition;

      stage.style.setProperty("--portfolio-hero-x", `${mix(0, -62, heroExit).toFixed(3)}vw`);
      stage.style.setProperty("--portfolio-location-x", `${mix(0, -18, heroExit).toFixed(3)}vw`);
      stage.style.setProperty("--portfolio-hero-opacity", heroCopyFade.toFixed(4));
      stage.style.setProperty("--portfolio-rail-opacity", (1 - smoothstep(0.08, 0.58, scrollUnits)).toFixed(4));
      stage.style.setProperty("--portfolio-rail-x", `${mix(0, -96, smoothstep(0.08, 0.58, scrollUnits)).toFixed(3)}px`);
      stage.style.setProperty("--portfolio-scene-opacity", mix(
        1,
        0.22,
        smoothstep(0.2, PROJECT_FIRST_CENTER_UNITS + 0.12, scrollUnits),
      ).toFixed(4));
      root.style.setProperty("--project-plane-y", "0vh");
      root.style.setProperty("--project-plane-opacity", projectPlaneVisibility.toFixed(4));
      root.style.setProperty("--stack-opacity", stackReveal.toFixed(4));
      root.style.setProperty("--journey-backdrop-opacity", Math.max(projectEntrance * 0.94, stackReveal).toFixed(4));
      root.style.setProperty("--journey-heading-opacity", (
        projectEntrance * (1 - smoothstep(0.08, 0.3, handoffProgress))
      ).toFixed(4));
      root.style.setProperty("--handoff-opacity", bridgeOpacity.toFixed(4));
      root.style.setProperty("--handoff-scale", mix(0.94, 1.035, bridgeScaleProgress).toFixed(4));
      root.style.setProperty("--stack-heading-opacity", stackHeadingReveal.toFixed(4));
      root.style.setProperty("--stack-heading-y", `${mix(32, 0, stackHeadingReveal).toFixed(3)}px`);
      root.dataset.handoffActive = handoffIsActive ? "true" : "false";

      projectTechnologyGroups.forEach((group, groupIndex) => {
        const groupElement = stackGroupRefs.current.get(group.id);
        if (!groupElement) return;
        const groupReveal = smoothstep(
          0.54 + groupIndex * 0.06,
          0.7 + groupIndex * 0.05,
          handoffProgress,
        );
        groupElement.style.setProperty("--stack-group-opacity", groupReveal.toFixed(4));
        groupElement.style.setProperty("--stack-group-x", `${mix(34, 0, groupReveal).toFixed(3)}px`);
        groupElement.style.setProperty("--stack-group-y", `${mix(18, 0, groupReveal).toFixed(3)}px`);
        groupElement.style.setProperty("--stack-group-scale", mix(0.94, 1, groupReveal).toFixed(4));
      });

      const nextActiveIndex = projectEntrance >= 0.42 && !stackIsActive
        ? Math.round(rotationPosition) % Math.max(1, projects.length)
        : -1;
      root.dataset.ringInteractive = nextActiveIndex >= 0 && !ringIsLocked ? "true" : "false";

      projects.forEach((project, projectIndex) => {
        const slide = projectRefs.current.get(project.id);
        if (!slide) return;
        const pose = getRingCardPose(
          projectIndex,
          rotationPosition,
          projects.length,
          pointerX * interactionWeight,
          pointerY * interactionWeight,
        );
        slide.style.setProperty("--project-x", `${(pose.x * mix(1, 1.75, ringExpansion)).toFixed(3)}vw`);
        slide.style.setProperty("--project-y", `${(
          pose.y * mix(1, 1.55, ringExpansion) + mix(18, 0, projectEntrance)
        ).toFixed(3)}vh`);
        slide.style.setProperty("--project-opacity", (projectVisibility * pose.opacity).toFixed(4));
        slide.style.setProperty("--project-scale", pose.scale.toFixed(4));
        slide.style.setProperty("--project-rotate", `${pose.rotate.toFixed(3)}deg`);
        slide.style.setProperty("--project-media-shift", `${(Math.cos(
          Math.PI / 2 + (projectIndex - rotationPosition) * ((Math.PI * 2) / Math.max(1, projects.length)),
        ) * 0.5).toFixed(3)}vw`);
        slide.style.setProperty("--project-image-brightness", mix(0.34, 0.9, pose.depth).toFixed(4));
        slide.style.setProperty("--project-image-saturation", mix(0.4, 0.8, pose.depth).toFixed(4));
        slide.style.setProperty("--project-overlay-opacity", mix(0.88, 0.56, pose.depth).toFixed(4));
        slide.style.setProperty("--project-light-opacity", mix(0.05, 0.12, pose.depth).toFixed(4));
        slide.style.zIndex = String(30 + Math.round(pose.depth * 60));
      });

      if (nextActiveIndex !== activeIndexRef.current) {
        activeIndexRef.current = nextActiveIndex;
        setActiveIndex(nextActiveIndex);
      }
      if (stackIsActive !== stackActiveRef.current) {
        stackActiveRef.current = stackIsActive;
        setStackActive(stackIsActive);
      }
      if (handoffIsActive !== handoffActiveRef.current) {
        handoffActiveRef.current = handoffIsActive;
        setHandoffActive(handoffIsActive);
      }

      const pointerIsSettling = Math.abs(pointerTargetX - pointerX) > 0.001
        || Math.abs(pointerTargetY - pointerY) > 0.001;
      const speedIsSettling = Math.abs(targetRotationSpeed - ringInteraction.rotationSpeed) > 0.001;
      const manualMotionIsSettling = Math.abs(ringInteraction.manualVelocity) > 0.004;
      if (autoCanAdvance
        || ringInteraction.dragging
        || pointerIsSettling
        || speedIsSettling
        || manualMotionIsSettling) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const schedule = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(render);
    };
    scheduleMotionRef.current = schedule;

    const handlePointerMove = (event) => {
      if (event.pointerType === "touch") return;
      if (ringInteraction.dragging) return;
      pointerTargetX = clamp((event.clientX / Math.max(1, window.innerWidth)) * 2 - 1, -1, 1);
      pointerTargetY = clamp((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1, -1, 1);
      schedule();
    };
    const resetPointer = () => {
      pointerTargetX = 0;
      pointerTargetY = 0;
      schedule();
    };
    const resetClock = () => {
      previousFrameTime = performance.now();
      schedule();
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", resetPointer);
    document.documentElement.addEventListener("pointerleave", resetPointer);
    document.addEventListener("visibilitychange", resetClock);
    window.addEventListener("resize", schedule);
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(track);
    }

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetPointer);
      document.documentElement.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", resetClock);
      window.removeEventListener("resize", schedule);
      scheduleMotionRef.current = () => {};
      resetMotion();
    };
  }, [active, metrics, projects, staticMode]);

  const showProjectDetail = (projectId) => {
    if (ringInteractionRef.current.dragging || ringLockedRef.current || stackActiveRef.current) return;
    hoveredProjectRef.current = projectId;
    setDetailProjectId(projectId);
    scheduleMotionRef.current();
  };
  const hideProjectDetail = (projectId, card) => {
    if (hoveredProjectRef.current === projectId) hoveredProjectRef.current = null;
    setDetailProjectId((current) => current === projectId ? null : current);
    card?.style.setProperty("--project-light-x", "50%");
    card?.style.setProperty("--project-light-y", "50%");
    scheduleMotionRef.current();
  };
  const updateCardPointer = (event) => {
    if (event.pointerType === "touch"
      || ringInteractionRef.current.dragging
      || ringLockedRef.current) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const localX = clamp((event.clientX - rect.left) / Math.max(1, rect.width));
    const localY = clamp((event.clientY - rect.top) / Math.max(1, rect.height));
    card.style.setProperty("--project-light-x", `${(localX * 100).toFixed(2)}%`);
    card.style.setProperty("--project-light-y", `${(localY * 100).toFixed(2)}%`);
  };

  const toggleRotation = () => {
    if (ringLockedRef.current || stackActiveRef.current) return;
    const interaction = ringInteractionRef.current;
    const nextPaused = !interaction.paused;
    interaction.paused = nextPaused;
    if (nextPaused) {
      interaction.rotationSpeed = 0;
      interaction.manualVelocity = 0;
    }
    setRotationPaused(nextPaused);
    scheduleMotionRef.current();
  };

  const beginRingDrag = (event) => {
    if (staticMode
      || ringLockedRef.current
      || stackActiveRef.current
      || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.target.closest("[data-ring-control], .portfolio-project__external")) return;
    const interaction = ringInteractionRef.current;
    interaction.pointerId = event.pointerId;
    interaction.candidate = true;
    interaction.dragging = false;
    interaction.startX = event.clientX;
    interaction.startY = event.clientY;
    interaction.lastX = event.clientX;
    interaction.lastTime = performance.now();
    interaction.manualVelocity = 0;
  };

  const moveRingDrag = (event) => {
    const interaction = ringInteractionRef.current;
    if (!interaction.candidate || interaction.pointerId !== event.pointerId) return;
    const totalX = event.clientX - interaction.startX;
    const totalY = event.clientY - interaction.startY;
    const threshold = event.pointerType === "touch" ? 10 : 6;

    if (!interaction.dragging) {
      if (Math.hypot(totalX, totalY) < threshold) return;
      if (Math.abs(totalX) <= Math.abs(totalY) * 1.15) {
        interaction.candidate = false;
        interaction.pointerId = null;
        return;
      }
      interaction.dragging = true;
      interaction.rotationSpeed = 0;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      event.currentTarget.dataset.dragging = "true";
      hoveredProjectRef.current = null;
      setDetailProjectId(null);
    }

    const now = performance.now();
    const elapsed = Math.max(12, now - interaction.lastTime) / 1000;
    const deltaX = event.clientX - interaction.lastX;
    const pixelsPerProject = clamp(window.innerWidth * 0.16, 140, 260);
    const projectDelta = deltaX / pixelsPerProject;
    const velocitySample = clamp(projectDelta / elapsed, -2.2, 2.2);
    interaction.pendingDelta += projectDelta;
    interaction.manualVelocity = mix(interaction.manualVelocity, velocitySample, 0.42);
    interaction.lastX = event.clientX;
    interaction.lastTime = now;
    scheduleMotionRef.current();
  };

  const endRingDrag = (event, cancelled = false) => {
    const interaction = ringInteractionRef.current;
    if (interaction.pointerId !== event.pointerId) return;
    const wasDragging = interaction.dragging;
    interaction.candidate = false;
    interaction.dragging = false;
    interaction.pointerId = null;
    event.currentTarget.removeAttribute("data-dragging");
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (cancelled) interaction.manualVelocity = 0;
    if (wasDragging) {
      interaction.blockClickUntil = performance.now() + 420;
      hoveredProjectRef.current = null;
      setDetailProjectId(null);
    }
    scheduleMotionRef.current();
  };

  const suppressDragClick = (event) => {
    if (event.target.closest("[data-ring-control]")) return;
    if (performance.now() < ringInteractionRef.current.blockClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return <section
    ref={rootRef}
    className="portfolio-journey"
    aria-label="项目与技术栈"
    data-static={staticMode ? "true" : "false"}
    data-stack-active={stackActive || staticMode ? "true" : "false"}
    data-handoff-active={handoffActive ? "true" : "false"}
  >
    <div className="portfolio-journey__backdrop" aria-hidden="true" />
    <div
      ref={projectPlaneRef}
      className="portfolio-journey__project-plane"
      aria-label="可拖拽旋转的项目环"
      inert={!staticMode && (handoffActive || stackActive) ? true : undefined}
      onPointerDown={beginRingDrag}
      onPointerMove={moveRingDrag}
      onPointerUp={(event) => endRingDrag(event)}
      onPointerCancel={(event) => endRingDrag(event, true)}
      onClickCapture={suppressDragClick}
    >
      <div className="portfolio-journey__drag-surface" aria-hidden="true" />
      <header className="portfolio-journey__heading">
        <div className="portfolio-journey__system-controls">
          <p><span aria-hidden="true" /> PROJECT DECK</p>
          <button
            className="portfolio-journey__rotation-toggle"
            type="button"
            data-ring-control="true"
            data-paused={rotationPaused ? "true" : "false"}
            aria-pressed={rotationPaused}
            aria-label={rotationPaused ? "继续项目环自动旋转" : "暂停项目环自动旋转"}
            tabIndex={!staticMode && (handoffActive || stackActive) ? -1 : 0}
            onClick={toggleRotation}
          >
            <i aria-hidden="true" />
            <span>AUTO / {rotationPaused ? "OFF" : "ON"}</span>
          </button>
          <span className="portfolio-journey__drag-hint">DRAG / ROTATE</span>
        </div>
        <div className="portfolio-journey__heading-meta">
          <strong>我的项目</strong>
          <span>
            {String(Math.max(0, activeIndex) + 1).padStart(2, "0")}
            &nbsp;/&nbsp;{String(projects.length).padStart(2, "0")}
          </span>
        </div>
      </header>

      {projects.map((project, projectIndex) => {
        const isCurrent = staticMode || activeIndex === projectIndex;
        const isDetailed = staticMode || detailProjectId === project.id;
        const cardsAreInteractive = staticMode
          || (activeIndex >= 0 && !stackActive && !handoffActive);
        return <article
          ref={(node) => {
            if (node) projectRefs.current.set(project.id, node);
            else projectRefs.current.delete(project.id);
          }}
          className={`portfolio-project portfolio-project--${project.id}`}
          style={{ "--project-accent-offset": `${22 + projectIndex * 14}px` }}
          aria-labelledby={`portfolio-project-${project.id}`}
          aria-current={isCurrent ? "true" : undefined}
          aria-hidden={cardsAreInteractive ? undefined : "true"}
          inert={cardsAreInteractive ? undefined : true}
          data-detailed={isDetailed ? "true" : "false"}
          onPointerEnter={() => showProjectDetail(project.id)}
          onPointerMove={updateCardPointer}
          onPointerLeave={(event) => hideProjectDetail(project.id, event.currentTarget)}
          onFocusCapture={() => showProjectDetail(project.id)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              hideProjectDetail(project.id, event.currentTarget);
            }
          }}
          key={project.id}
        >
          <div className="portfolio-project__media">
            <img src={project.cover} alt={`${project.title} 项目视觉`} loading="lazy" />
            <p>{project.index} / {project.year}</p>
          </div>
          <button
            className="portfolio-project__open-hit"
            type="button"
            aria-label={`打开 ${project.title} 项目`}
            onClick={(event) => {
              if (performance.now() < ringInteractionRef.current.blockClickUntil) {
                event.preventDefault();
                return;
              }
              onOpenProject(project.id);
            }}
          />
          <div
            className="portfolio-project__copy"
            aria-hidden={isDetailed ? undefined : "true"}
            inert={isDetailed ? undefined : true}
          >
            <p className="portfolio-project__category">{project.category}</p>
            <h2 id={`portfolio-project-${project.id}`}>{project.title}</h2>
            {project.status && <p className="portfolio-project__status"><i aria-hidden="true" />{project.status}</p>}
            <p className="portfolio-project__excerpt">{project.excerpt}</p>
            <div className="portfolio-project__actions">
              <button
                className="text-link portfolio-project__reader-action"
                type="button"
                onClick={() => onOpenProject(project.id)}
              >
                查看项目 <ArrowRight size={17} weight="bold" aria-hidden="true" />
              </button>
              <ProjectDestination project={project} />
            </div>
          </div>
          <div className="portfolio-project__compact-label" aria-hidden="true">
            <strong>{project.title}</strong>
            <span>{project.category}</span>
          </div>
          <ul className="portfolio-project__inline-stack" aria-hidden={isDetailed ? undefined : "true"}>
            {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
        </article>;
      })}
    </div>

    <div className="portfolio-journey__handoff" aria-hidden="true">
      <i className="portfolio-journey__handoff-mark" />
      <p className="portfolio-journey__handoff-from">
        FROM {String(projects.length).padStart(2, "0")} PROJECTS
      </p>
      <p className="portfolio-journey__handoff-into">
        INTO ONE CAPABILITY SYSTEM
      </p>
    </div>

    <section
      ref={stackRef}
      className="portfolio-stack"
      aria-labelledby="portfolio-stack-title"
      aria-hidden={stackActive || staticMode ? undefined : "true"}
      inert={stackActive || staticMode ? undefined : true}
    >
      <header className="portfolio-stack__heading">
        <p>DERIVED FROM {String(projects.length).padStart(2, "0")} PROJECTS</p>
        <h2 id="portfolio-stack-title">技术栈不是清单，<br />是项目留下的路径。</h2>
      </header>
      <div className="portfolio-stack__groups">
        {projectTechnologyGroups.map((group) => {
          const technologies = uniqueTechnologies.filter((technology) => technology.groupId === group.id);
          return <article
            ref={(node) => {
              if (node) stackGroupRefs.current.set(group.id, node);
              else stackGroupRefs.current.delete(group.id);
            }}
            className="portfolio-stack__group"
            data-group={group.id}
            key={group.id}
          >
            <p>{group.eyebrow}</p>
            <h3>{group.title}</h3>
            <ul className="portfolio-stack__semantic-list">
              {technologies.map((technology) => <li key={technology.id}>
                {technology.label}{technology.sources.length > 1 ? ` ×${technology.sources.length}` : ""}
              </li>)}
            </ul>
          </article>;
        })}
      </div>
    </section>
  </section>;
}
