let pageAnchorAnimationFrame = 0;
let cancelPageAnchorAnimation = () => {};

function animatePageAnchor(target) {
  cancelPageAnchorAnimation();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    target.scrollIntoView({ behavior: "auto", block: "start" });
    return;
  }

  const startY = window.scrollY;
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const targetY = Math.min(maxY, Math.max(0, startY + target.getBoundingClientRect().top));
  const distance = targetY - startY;
  if (Math.abs(distance) < 1) return;

  const duration = Math.min(1800, Math.max(1050, 1000 + Math.abs(distance) * 0.08));
  const startedAt = performance.now();
  const cancelEvents = ["wheel", "touchstart", "pointerdown"];
  const cancelKeys = new Set([
    "ArrowDown",
    "ArrowUp",
    "End",
    "Home",
    "PageDown",
    "PageUp",
    " ",
  ]);
  let active = true;

  const cleanup = () => {
    if (!active) return;
    active = false;
    window.cancelAnimationFrame(pageAnchorAnimationFrame);
    pageAnchorAnimationFrame = 0;
    cancelEvents.forEach((type) => window.removeEventListener(type, cleanup));
    window.removeEventListener("keydown", handleKeydown);
    cancelPageAnchorAnimation = () => {};
  };
  const handleKeydown = (event) => {
    if (cancelKeys.has(event.key)) cleanup();
  };
  const easeInOutCubic = (progress) => (
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - ((-2 * progress + 2) ** 3) / 2
  );
  const tick = (now) => {
    if (!active) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress >= 1) {
      cleanup();
      return;
    }
    pageAnchorAnimationFrame = window.requestAnimationFrame(tick);
  };

  cancelPageAnchorAnimation = cleanup;
  cancelEvents.forEach((type) => window.addEventListener(type, cleanup, { passive: true }));
  window.addEventListener("keydown", handleKeydown);
  pageAnchorAnimationFrame = window.requestAnimationFrame(tick);
}

export function handlePageAnchorClick(event) {
  if (
    event.defaultPrevented
    || event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
  ) return;

  const anchor = event.currentTarget;
  const hash = anchor.hash || anchor.getAttribute("href");
  if (!hash?.startsWith("#")) return;

  let targetId;
  try {
    targetId = decodeURIComponent(hash.slice(1));
  } catch {
    return;
  }
  const target = document.getElementById(targetId);
  if (!target) return;

  event.preventDefault();
  if (window.location.hash !== hash) {
    const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
    window.history.pushState({ ...(window.history.state || {}) }, "", nextUrl);
  }
  animatePageAnchor(target);
}
