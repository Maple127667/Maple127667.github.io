import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  EnvelopeSimple,
  GithubLogo,
  List,
  WechatLogo,
  X,
} from "@phosphor-icons/react";
import {
  articles,
  featuredArticle,
  formatArticleDate,
  getArticles,
} from "./content/articles/index.js";
import { profile, profileEn, technologyGroups } from "./content/profile.js";
import { getProjects, projects } from "./content/projects/index.js";
import { LocaleProvider, useLocale } from "./i18n.jsx";
import { PortfolioJourney } from "./PortfolioJourney.jsx";
import { getPortfolioJourneyMetrics } from "./portfolioJourneyTimeline.js";
import { VibeCodingOpening } from "./VibeCodingIntro.jsx";
import { VibeBootLoader } from "./VibeBootLoader.jsx";
import StarField from "./StarField.jsx";
import { subscribeCriticalResources } from "./criticalResourceLoader.js";

let asteroidSceneModulePromise;
const loadAsteroidSceneModule = () => {
  asteroidSceneModulePromise ??= import("./AsteroidScene.jsx");
  return asteroidSceneModulePromise;
};
const LazyAsteroidScene = lazy(loadAsteroidSceneModule);
const READER_RESOURCE_TIMEOUT_MS = 7000;
let markdownContentModulePromise;
const loadMarkdownContentModule = () => {
  markdownContentModulePromise ??= new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("Markdown renderer load timed out")),
      READER_RESOURCE_TIMEOUT_MS,
    );
    import("./MarkdownContent.jsx").then(
      (module) => {
        window.clearTimeout(timeout);
        resolve(module);
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  }).catch((error) => {
    markdownContentModulePromise = undefined;
    throw error;
  });
  return markdownContentModulePromise;
};
const LazyMarkdownContent = lazy(loadMarkdownContentModule);
const INTRO_SESSION_KEY = "maple-vibe-opening-v1";
const HARD_RELOAD_INTENT_KEY = "maple-vibe-hard-reload-intent";
const HARD_RELOAD_INTENT_TTL_MS = 15000;

const sectionRailItems = [
  { id: "top", number: "01" },
  { id: "projects", number: "02" },
  { id: "stack", number: "03" },
  { id: "contact", number: "04" },
];
const portfolioJourneyMetrics = getPortfolioJourneyMetrics(projects.length);

const pendingArticleSlots = ["03", "04"];

function parseContentRoute(pathname = window.location.pathname) {
  const match = pathname.match(/^\/(articles|projects)\/([^/]+)\/?$/);
  if (!match) return null;

  try {
    return {
      type: match[1] === "articles" ? "article" : "project",
      id: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

function contentRoutePath(type, id) {
  const collection = type === "article" ? "articles" : "projects";
  return `/${collection}/${encodeURIComponent(id)}`;
}

function canUseProjectViewTransition(sourceElement) {
  if (!sourceElement?.isConnected || typeof document.startViewTransition !== "function") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const rect = sourceElement.getBoundingClientRect();
  return rect.width > 0
    && rect.height > 0
    && rect.bottom > 0
    && rect.right > 0
    && rect.top < window.innerHeight
    && rect.left < window.innerWidth;
}

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

function handlePageAnchorClick(event) {
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

function useScrollProgress() {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        document.documentElement.style.setProperty("--scroll-progress", `${max > 0 ? Math.min(1, window.scrollY / max) : 0}`);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(document.body);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
}

function AsteroidSceneFallback({ compatibility = false }) {
  return <div className="asteroid-stage asteroid-loading" aria-hidden="true"><span className="scene-label scene-label--top">{compatibility ? "GRAVITY FIELD / COMPATIBILITY MODE" : "GRAVITY FIELD / INITIALIZING"}</span><span className="scene-label scene-label--bottom">{compatibility ? "STATIC SPACE FIELD / READY" : "THREE-BODY / STANDBY"}</span></div>;
}

class AsteroidSceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.props.onProgress?.({ progress: 1, status: "SCENE READY / COMPATIBILITY MODE" });
    this.props.onReady?.({ mode: "fallback", error });
  }

  render() {
    if (this.state.failed) return <AsteroidSceneFallback compatibility />;
    return this.props.children;
  }
}

function DeferredAsteroidScene({ forceFallback, onProgress, onReady, suspended = false }) {
  if (forceFallback) return <AsteroidSceneFallback compatibility />;
  return <AsteroidSceneBoundary onProgress={onProgress} onReady={onReady}>
    <Suspense fallback={<AsteroidSceneFallback />}>
      <LazyAsteroidScene onProgress={onProgress} onReady={onReady} suspended={suspended} />
    </Suspense>
  </AsteroidSceneBoundary>;
}

function useActiveSection() {
  const [activeSection, setActiveSection] = useState("top");

  useEffect(() => {
    let frame;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const marker = window.scrollY + window.innerHeight * 0.46;
        let current = sectionRailItems[0].id;
        sectionRailItems.forEach((item) => {
          const section = document.getElementById(item.id);
          if (section && section.offsetTop <= marker) current = item.id;
        });
        setActiveSection(current);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return activeSection;
}

function SectionRail({ activeSection }) {
  const { copy } = useLocale();
  return <nav className="hero-rail" aria-label={copy.nav.progress}>
    {sectionRailItems.map((item) => <a key={item.id} href={`#${item.id}`} onClick={handlePageAnchorClick} aria-label={`${item.number} ${copy.rail[item.id].label}`} aria-current={activeSection === item.id ? "location" : undefined} className={activeSection === item.id ? "is-active" : ""}>{item.number}</a>)}
    <ArrowDown size={17} aria-hidden="true" />
  </nav>;
}

function Header({ activeSection, onReplay }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { copy, locale, setLocale } = useLocale();
  const menuButtonRef = useRef(null);
  const close = () => setMenuOpen(false);
  const navigate = (event) => {
    close();
    handlePageAnchorClick(event);
  };

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  return <header className="site-header">
    <a className="wordmark" href="#top" onClick={handlePageAnchorClick} aria-label={copy.nav.home}>MAPLE <span aria-hidden="true" /></a>
    <button ref={menuButtonRef} className="menu-toggle" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="site-navigation" aria-label={menuOpen ? copy.nav.close : copy.nav.open}>{menuOpen ? <X size={22} /> : <List size={22} />}</button>
    <nav id="site-navigation" className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label={copy.nav.mainNav}>
      {sectionRailItems.map((item) => <a key={item.id} href={`#${item.id}`} onClick={navigate} aria-current={activeSection === item.id ? "location" : undefined} className={activeSection === item.id ? "is-active" : ""}><span className="site-nav__index" aria-hidden="true">{item.number}</span><span className="site-nav__label">{copy.rail[item.id].navLabel}</span></a>)}
      {onReplay && <button className="site-nav__replay" type="button" onClick={() => { close(); onReplay(); }}>{copy.nav.replay}</button>}
      <button className="site-nav__lang" type="button" lang={locale === "zh" ? "en" : "zh"} aria-label={copy.nav.langActionAria} onClick={() => { close(); setLocale(locale === "zh" ? "en" : "zh"); }}>{copy.nav.langAction}</button>
    </nav>
    <span className="scroll-meter" aria-hidden="true" />
  </header>;
}

function PageChrome({ onReplay }) {
  const activeSection = useActiveSection();
  return <><Header activeSection={activeSection} onReplay={onReplay} /><SectionRail activeSection={activeSection} /></>;
}

function HeroSection({ forceSceneFallback, onSceneProgress, onSceneReady, sceneEnabled = true, sceneSuspended = false }) {
  const { locale, copy } = useLocale();
  const heroText = locale === "en" ? profileEn : profile;
  return <section className="hero snap-panel" aria-labelledby="hero-title">
    <StarField />
    <div className="hero__copy"><p className="eyebrow">{profile.name.toUpperCase()} / {copy.hero.eyebrowSuffix}</p><h1 id="hero-title"><span className="hero__name">{profile.name.toUpperCase()} <em>/</em></span><span className="hero__role-lockup"><span className="hero__role-en">CREATIVE DEVELOPER</span><span className="hero__role-cn">{copy.hero.roleLines[0]}{copy.hero.roleLines.length > 1 && <><br />{copy.hero.roleLines[1]}</>}</span></span></h1><p className="hero__statement">{heroText.heroStatement[0]}<br />{heroText.heroStatement[1]}</p><p className="availability"><span aria-hidden="true" />{profile.availability}</p><a className="primary-button" href="#projects" onClick={handlePageAnchorClick}>{copy.hero.viewWorks} <ArrowDown size={21} weight="bold" aria-hidden="true" /></a><p className="location">{profile.location}<br />© {profile.name.toUpperCase()} 2026</p></div>
    <div className="hero__visual">{sceneEnabled && <DeferredAsteroidScene forceFallback={forceSceneFallback} onProgress={onSceneProgress} onReady={onSceneReady} suspended={sceneSuspended} />}</div>
  </section>;
}

function hasCompletedOpening() {
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === "complete";
  } catch {
    return false;
  }
}

function getDocumentNavigationType() {
  try {
    const navigationEntry = window.performance?.getEntriesByType?.("navigation")?.[0];
    if (navigationEntry) return navigationEntry.type;
    if (window.performance?.navigation?.type === 1) return "reload";
    if (window.performance?.navigation?.type === 2) return "back_forward";
    return "navigate";
  } catch {
    return "navigate";
  }
}

function hasFreshHardReloadIntent() {
  try {
    const requestedAt = Number(window.sessionStorage.getItem(HARD_RELOAD_INTENT_KEY));
    return Number.isFinite(requestedAt)
      && requestedAt > 0
      && Date.now() - requestedAt <= HARD_RELOAD_INTENT_TTL_MS;
  } catch {
    return false;
  }
}

function ProjectSection({ project, onOpenProject }) {
  return <article className={`project project--${project.align} project--${project.id}`} aria-labelledby={`project-${project.id}`}>
    <div className="project__image-wrap"><img src={project.cover} alt={`${project.title}项目视觉`} className="project__image" loading="lazy" decoding="async" fetchPriority="low" /></div>
    <div className="project__copy">
      <span className="project__number">{project.index}</span>
      <p className="project__kicker">{project.category}</p>
      <h3 id={`project-${project.id}`}>{project.title}</h3>
      <div className="project__meta-line">
        <p className="project__year">{project.year}</p>
        {project.status && <p className="project__status"><i aria-hidden="true" />{project.status}</p>}
      </div>
      <p className="project__description">{project.excerpt}</p>
      <ProjectActions project={project} onOpenProject={onOpenProject} />
    </div>
  </article>;
}

function ProjectExternalLink({ project, compact = false }) {
  if (!project.link) return null;

  return <a className={`project-external-link${compact ? " project-external-link--compact" : ""}`} href={project.link.url} target="_blank" rel="noreferrer">
    {project.link.type === "github" ? <GithubLogo size={18} aria-hidden="true" /> : <ArrowUpRight size={18} aria-hidden="true" />}
    <span>{project.link.label}</span>
  </a>;
}

function ProjectActions({ project, onOpenProject, compact = false }) {
  return <div className={`project-actions${compact ? " project-actions--compact" : ""}`}>
    <button type="button" className="text-link" aria-haspopup="dialog" onClick={() => onOpenProject(project.id)}>查看项目 <ArrowRight size={compact ? 16 : 17} weight="bold" aria-hidden="true" /></button>
    <ProjectExternalLink project={project} compact={compact} />
  </div>;
}

function FeaturedEssayInterlude({ article, onOpenArticle }) {
  const titleBreakIndex = article.title.indexOf("：");
  const titleLead = titleBreakIndex >= 0 ? article.title.slice(0, titleBreakIndex + 1) : article.title;
  const titleTail = titleBreakIndex >= 0 ? article.title.slice(titleBreakIndex + 1).trim() : "";

  return <aside className="featured-note snap-panel" aria-labelledby="featured-note-title">
    <div className="featured-note__meta">
      <p>FEATURED ESSAY / {article.index}</p>
      <span>{article.category}</span>
      <span>{formatArticleDate(article.date)}</span>
      <span>{article.readTime}</span>
    </div>
    <div className="featured-note__content">
      <p className="featured-note__eyebrow">作品之间，换一种速度</p>
      <h3 id="featured-note-title">
        <span className="featured-note__title-line">{titleLead}</span>
        {titleTail && <span className="featured-note__title-line">{titleTail}</span>}
      </h3>
      <p>{article.excerpt}</p>
      <button type="button" className="read-button" aria-haspopup="dialog" onClick={(event) => onOpenArticle(article.id, event.currentTarget)}>进入阅读模式 <ArrowUpRight size={18} aria-hidden="true" /></button>
    </div>
  </aside>;
}

function ProjectArchive({ items, onOpenProject }) {
  return <div className="project-archive snap-panel" aria-label="更多项目">
    <div className="project-archive__heading"><p>更多项目 / MORE WORK</p><span>能力的宽度，不需要重复同一种音量。</span></div>
    <div className={`project-archive__grid${items.length === 1 ? " project-archive__grid--single" : ""}`}>
      {items.map((project) => <article className={`project-card project-card--${project.id}`} key={project.id} aria-labelledby={`project-${project.id}`}>
        <div className="project-card__image"><img src={project.cover} alt={`${project.title}项目视觉`} loading="lazy" decoding="async" fetchPriority="low" /></div>
        <div className="project-card__copy"><span>{project.index} / {project.year}</span><p>{project.category}</p><h3 id={`project-${project.id}`}>{project.title}</h3><p>{project.excerpt}</p><ProjectActions project={project} onOpenProject={onOpenProject} compact /></div>
      </article>)}
    </div>
  </div>;
}

function ProfileSection() {
  return <section className="profile snap-panel" id="about" aria-labelledby="profile-title">
    <div className="section-heading"><p><span aria-hidden="true" /> 关于我</p><p className="section-heading__meta">PROFILE / STACK / PRACTICE</p></div>
    <div className="profile__body">
      <div className="profile__intro">
        <p className="eyebrow">{profile.role.toUpperCase()} / 03</p>
        <h2 id="profile-title">{profile.headline[0]}<br />{profile.headline[1]}</h2>
        <p className="profile__summary">{profile.summary}</p>
        <div className="profile__meta"><span><i aria-hidden="true" />{profile.availability}</span><span>{profile.location}</span></div>
      </div>
      <div className="profile__stack">
        <div className="profile__stack-heading"><p>技术栈</p><span>CORE STACK / VERIFIED PRACTICE</span></div>
        <ol className="profile__stack-list">
          {technologyGroups.map((group) => <li className="profile__stack-item" key={group.index}>
            <span className="profile__stack-index">{group.index}</span>
            <div><p>{group.label}</p><h3>{group.title}</h3><ul>{group.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul></div>
          </li>)}
        </ol>
      </div>
    </div>
  </section>;
}

function NotesSection({ onOpenArticle }) {
  const otherArticles = articles.filter((article) => article.id !== featuredArticle.id);

  return <section className="notes" id="notes" aria-labelledby="notes-title">
    <div className="notes__editorial snap-panel">
      <article className="notes__lead">
        <p className="notes__label">文章与笔记 / ARTICLE {featuredArticle.index}</p>
        <p className="notes__meta">{featuredArticle.category} · {formatArticleDate(featuredArticle.date)} · {featuredArticle.readTime}</p>
        <h3 id="notes-title">{featuredArticle.title}</h3>
        <p>{featuredArticle.excerpt}</p>
        <button type="button" className="read-button" aria-haspopup="dialog" onClick={(event) => onOpenArticle(featuredArticle.id, event.currentTarget)}>阅读全文 <ArrowUpRight size={18} aria-hidden="true" /></button>
      </article>
      <div className="notes__index" aria-label="文章索引">
        <p className="notes__index-title">其余文章 / INDEX</p>
        {otherArticles.map((article) => <button className="article-index" type="button" aria-haspopup="dialog" onClick={(event) => onOpenArticle(article.id, event.currentTarget)} key={article.id}>
          <span className="article-index__number">{article.index}</span>
          <span className="article-index__copy"><span>{article.category} · {article.readTime}</span><strong>{article.title}</strong><small>{article.excerpt}</small></span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </button>)}
        {pendingArticleSlots.map((index) => <div className="article-index article-index--pending" aria-label={`文章 ${index} 待添加`} key={index}>
          <span className="article-index__number">{index}</span>
          <span className="article-index__copy"><span>ARTICLE / UPCOMING</span><strong>待添加</strong><small>新的文章正在整理中。</small></span>
          <span className="article-index__pending-mark" aria-hidden="true">—</span>
        </div>)}
      </div>
    </div>
  </section>;
}

function useReaderDialog(isOpen, onClose, closeRef, rootRef, restoreFocusRef) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = restoreFocusRef?.current ?? document.activeElement;
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(rootRef.current?.querySelectorAll("button, a[href]") ?? [])]
        .filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      window.requestAnimationFrame(() => {
        if (previousFocus?.isConnected && !previousFocus.closest?.("[inert]")) {
          previousFocus.focus({ preventScroll: true });
        }
      });
    };
  }, [isOpen, closeRef, restoreFocusRef, rootRef]);
}

function ContentsIndex({ headings }) {
  return <aside><span>CONTENTS</span><ol>{headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`}>{heading.title}</a></li>)}</ol></aside>;
}

function ProjectContentsIndex({ project, headings, readerRef }) {
  const [contentsOpen, setContentsOpen] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState(headings[0]?.id ?? null);
  const { copy } = useLocale();

  useEffect(() => {
    const reader = readerRef.current;
    if (!reader || !headings.length) return undefined;
    let frame = 0;
    const updateActiveHeading = () => {
      const threshold = reader.getBoundingClientRect().top + 150;
      let nextHeadingId = headings[0].id;
      headings.forEach((heading) => {
        const target = reader.querySelector(`[id="${CSS.escape(heading.id)}"]`);
        if (target?.getBoundingClientRect().top <= threshold) nextHeadingId = heading.id;
      });
      setActiveHeadingId((current) => current === nextHeadingId ? current : nextHeadingId);
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateActiveHeading();
      });
    };
    scheduleUpdate();
    reader.addEventListener("scroll", scheduleUpdate, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      reader.removeEventListener("scroll", scheduleUpdate);
    };
  }, [headings, readerRef]);

  const navigateToHeading = (headingId) => {
    const target = readerRef.current?.querySelector(`#${CSS.escape(headingId)}`);
    if (!target) return;
    setActiveHeadingId(headingId);
    if (window.matchMedia("(max-width: 760px)").matches) setContentsOpen(false);
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  return <aside className="project-reader__index">
    <p>PROJECT RECORD / {project.index}</p>
    <dl>
      <div><dt>PERIOD</dt><dd>{project.year}</dd></div>
      <div><dt>FIELD</dt><dd>{project.category}</dd></div>
    </dl>
    <button
      className="project-reader__index-toggle"
      type="button"
      aria-expanded={contentsOpen}
      onClick={() => setContentsOpen((current) => !current)}
    >
      <span>{copy.reader.chapters}</span><i aria-hidden="true">{contentsOpen ? copy.reader.collapse : copy.reader.expand}</i>
    </button>
    <nav aria-label={copy.reader.projectChaptersAria(project.title)} data-open={contentsOpen ? "true" : "false"}>
      <span>CONTENTS</span>
      <ol>{headings.map((heading, index) => <li key={heading.id}>
        <button
          type="button"
          aria-current={activeHeadingId === heading.id ? "location" : undefined}
          onClick={() => navigateToHeading(heading.id)}
        >
          <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
          <span>{heading.title}</span>
        </button>
      </li>)}</ol>
    </nav>
  </aside>;
}

function reloadReaderContent() {
  window.location.reload();
}

function ReaderContentLoadError({ onRetry = reloadReaderContent, onReady }) {
  useLayoutEffect(() => {
    onReady?.();
  }, [onReady]);

  const { copy } = useLocale();
  return <div className="article-reader__prose" role="alert">
    <p><strong>{copy.reader.loadErrorTitle}</strong></p>
    <p>{copy.reader.loadErrorBody}</p>
    <button className="text-link" type="button" onClick={onRetry}>{copy.reader.loadErrorRetry}</button>
  </div>;
}

class MarkdownContentBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onReady?.();
  }

  render() {
    if (this.state.failed) return <ReaderContentLoadError onReady={this.props.onReady} />;
    return this.props.children;
  }
}

function ReaderRenderReady({ onReady, children }) {
  useLayoutEffect(() => {
    onReady?.();
  }, [onReady]);
  return children;
}

function ReaderMarkdownBody({ item, endLabel, onReady }) {
  const [body, setBody] = useState(null);
  const [bodyFailed, setBodyFailed] = useState(false);

  useEffect(() => {
    let current = true;
    let settled = false;
    setBody(null);
    setBodyFailed(false);
    const timeout = window.setTimeout(() => {
      if (!current || settled) return;
      settled = true;
      setBodyFailed(true);
    }, READER_RESOURCE_TIMEOUT_MS);
    item.loadBody().then((content) => {
      if (!current || settled) return;
      settled = true;
      window.clearTimeout(timeout);
      setBody(content);
    }).catch(() => {
      if (!current || settled) return;
      settled = true;
      window.clearTimeout(timeout);
      setBodyFailed(true);
    });
    return () => {
      current = false;
      window.clearTimeout(timeout);
    };
  }, [item]);

  if (bodyFailed) return <ReaderContentLoadError onReady={onReady} />;
  if (body === null) return null;
  return <MarkdownContentBoundary onReady={onReady}>
    <Suspense fallback={null}>
      <ReaderRenderReady onReady={onReady}>
        <LazyMarkdownContent content={body} headings={item.headings} endLabel={endLabel} />
      </ReaderRenderReady>
    </Suspense>
  </MarkdownContentBoundary>;
}

function ArticleReader({ article, interactive = true, onClose, onContentReady, restoreFocusRef }) {
  const closeRef = useRef(null);
  const readerRef = useRef(null);
  const { copy, locale } = useLocale();
  useReaderDialog(Boolean(article) && interactive, onClose, closeRef, readerRef, restoreFocusRef);

  if (!article) return null;

  return <div ref={readerRef} className="article-reader content-reader" role={interactive ? "dialog" : undefined} aria-modal={interactive ? "true" : undefined} aria-labelledby="article-reader-title" aria-hidden={interactive ? undefined : "true"} inert={interactive ? undefined : true}>
    <div className="article-reader__bar">
      <p>MAPLE / FIELD NOTES / {article.index}</p>
      <button ref={closeRef} type="button" onClick={onClose} aria-label={copy.reader.closeArticle}><span>{copy.reader.backHome}</span><X size={21} aria-hidden="true" /></button>
    </div>
    <article className="article-reader__document">
      <header className="article-reader__head">
        <p>{article.category}<br />{formatArticleDate(article.date)}<br />{article.readTime}</p>
        <div><span>ARTICLE / {article.index}</span><h2 id="article-reader-title">{article.title}</h2><p>{article.excerpt}</p></div>
      </header>
      <div className="article-reader__body">
        <ContentsIndex headings={article.headings} />
        <ReaderMarkdownBody key={`${locale}:${article.id}`} item={article} endLabel={`END OF ARTICLE / ${article.index}`} onReady={onContentReady} />
      </div>
    </article>
  </div>;
}

function ProjectReader({ project, interactive = true, onClose, onContentReady }) {
  const closeRef = useRef(null);
  const readerRef = useRef(null);
  const { copy, locale } = useLocale();
  useReaderDialog(Boolean(project) && interactive, onClose, closeRef, readerRef);

  if (!project) return null;

  const longform = project.headings.length >= 3;
  const headlineDividerMatch = project.headline.match(/[：:]\s*/);
  const statement = headlineDividerMatch
    ? project.headline.slice(headlineDividerMatch.index + headlineDividerMatch[0].length).trim()
    : project.headline !== project.title
      ? project.headline
      : project.excerpt;

  return <div
    ref={readerRef}
    className="article-reader project-reader content-reader"
    role={interactive ? "dialog" : undefined}
    aria-modal={interactive ? "true" : undefined}
    aria-labelledby="project-reader-title"
    aria-hidden={interactive ? undefined : "true"}
    inert={interactive ? undefined : true}
    data-content-mode={longform ? "longform" : "compact"}
    data-project-id={project.id}
    style={{ viewTransitionName: "project-card" }}
  >
    <div className="article-reader__bar project-reader__bar">
      <p><span>MAPLE / PROJECT</span><strong>{project.index} — {project.title}</strong></p>
      <button ref={closeRef} type="button" onClick={onClose} aria-label={copy.reader.backToProjects}><ArrowLeft size={21} aria-hidden="true" /><span>{copy.reader.backToProjects}</span></button>
    </div>
    <article className="article-reader__document">
      <header
        className="project-reader__hero"
        style={{
          "--project-cover-fit": project.coverFit,
          "--project-cover-position": project.coverPosition,
          "--project-cover-background": project.coverBackground,
        }}
      >
        <figure className="project-reader__hero-media"><img src={project.cover} alt={copy.journey.projectVisualAlt(project.title)} decoding="async" fetchPriority="high" /></figure>
        <p className="project-reader__hero-meta"><span>{project.index} / {project.year}</span><span>{project.category}</span></p>
        <div className="project-reader__hero-copy">
          <p className="project-reader__hero-category">SELECTED WORK / {project.index}</p>
          {project.status && <p className="project-reader__hero-status"><i aria-hidden="true" />{project.status}</p>}
          <h1 id="project-reader-title">{project.title}<em aria-hidden="true">/</em></h1>
          <p className="project-reader__hero-statement">{statement}</p>
          {statement !== project.excerpt && <p className="project-reader__hero-excerpt">{project.excerpt}</p>}
          <div className="project-reader__hero-actions"><ProjectExternalLink project={project} /></div>
        </div>
        <div className="project-reader__hero-tech">
          <p>TECHNICAL PROFILE</p>
          <ul>{project.technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul>
        </div>
      </header>
      <div className="article-reader__body project-reader__body">
        {longform && <ProjectContentsIndex project={project} headings={project.headings} readerRef={readerRef} />}
        <div className="project-reader__prose-column">
          <ReaderMarkdownBody key={`${locale}:${project.id}`} item={project} endLabel={`END OF PROJECT / ${project.index}`} onReady={onContentReady} />
          <div className="project-reader__endnav">
            <button type="button" onClick={onClose}><ArrowLeft size={19} aria-hidden="true" />{copy.reader.backToProjects}</button>
            <ProjectExternalLink project={project} />
          </div>
        </div>
      </div>
    </article>
  </div>;
}

function NotFoundPage({ path, onGoHome }) {
  const { copy } = useLocale();
  return <main className="not-found" aria-labelledby="not-found-title">
    <div className="not-found__orbit" aria-hidden="true"><span /><span /><span /></div>
    <header className="not-found__header"><button type="button" onClick={onGoHome} aria-label={copy.notFound.homeAria}>MAPLE <i aria-hidden="true" /></button><span>ERROR / 404</span></header>
    <div className="not-found__content">
      <p className="not-found__eyebrow">404 / LOST IN ORBIT</p>
      <h1 id="not-found-title">{copy.notFound.titleLine1}<br />{copy.notFound.titleLine2}</h1>
      <p>{copy.notFound.body}</p>
      <code>{path}</code>
      <button className="not-found__action" type="button" onClick={onGoHome}>{copy.notFound.action} <ArrowRight size={19} weight="bold" aria-hidden="true" /></button>
    </div>
    <p className="not-found__status">SYSTEM STATUS / ROUTE NOT FOUND</p>
  </main>;
}

function WechatDialog({ open, onClose, restoreFocusRef }) {
  const { copy } = useLocale();
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  useReaderDialog(open, onClose, closeRef, dialogRef, restoreFocusRef);

  if (!open) return null;

  return <div
    ref={dialogRef}
    className="wechat-dialog content-reader"
    role="dialog"
    aria-modal="true"
    aria-label={copy.wechat.dialogAria}
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <div className="wechat-dialog__panel">
      <button ref={closeRef} className="wechat-dialog__close" type="button" onClick={onClose} aria-label={copy.wechat.closeAria}>
        <X size={21} aria-hidden="true" />
      </button>
      <p className="wechat-dialog__eyebrow">WECHAT / CONTACT</p>
      <figure className="contact__qr">
        <div><img src={profile.wechat.qr} alt={copy.wechat.qrAlt(profile.wechat.label)} decoding="async" /></div>
        <figcaption><WechatLogo size={18} aria-hidden="true" /><span>{copy.wechat.idLabel}<strong>{profile.wechat.label}</strong></span></figcaption>
      </figure>
    </div>
  </div>;
}
export function App() {
  return <LocaleProvider><AppContent /></LocaleProvider>;
}

function AppContent() {
  const { locale, copy } = useLocale();
  const localizedArticles = useMemo(() => getArticles(locale), [locale]);
  const localizedProjects = useMemo(() => getProjects(locale), [locale]);
  useScrollProgress();
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [wechatOpen, setWechatOpen] = useState(false);
  const [hardReloadIntent] = useState(hasFreshHardReloadIntent);
  const [booting, setBooting] = useState(true);
  const [sceneLoad, setSceneLoad] = useState({
    status: "LOADING SPACE RUNTIME",
    progress: 0,
    ready: false,
    forceFallback: false,
  });
  const [criticalLoad, setCriticalLoad] = useState({
    key: null,
    status: "LOADING PAGE ASSETS",
    progress: 0,
    ready: false,
    degraded: false,
  });
  const [introRunKey, setIntroRunKey] = useState(0);
  const [introActive, setIntroActive] = useState(() => (
    window.location.pathname === "/"
    && !window.location.hash
    && (
      hardReloadIntent
      || (getDocumentNavigationType() === "navigate" && !hasCompletedOpening())
    )
  ));
  const contentRoute = parseContentRoute(pathname);
  const activeArticle = contentRoute?.type === "article" ? localizedArticles.find((article) => article.id === contentRoute.id) || null : null;
  const activeProject = contentRoute?.type === "project" ? localizedProjects.find((project) => project.id === contentRoute.id) || null : null;
  const activeContentItem = activeArticle || activeProject;
  const activeContentKey = contentRoute && activeContentItem ? `${locale}:${contentRoute.type}:${activeContentItem.id}` : null;
  const criticalPageKey = `page:${locale}:${pathname}`;
  const readerOpen = Boolean(activeArticle || activeProject);
  const isNotFound = pathname !== "/" && (!contentRoute || !readerOpen);
  const wechatDialogOpen = pathname === "/" && wechatOpen;
  const [readerContentReadyKey, setReaderContentReadyKey] = useState(null);
  const markReaderContentReady = useCallback(() => {
    if (activeContentKey) setReaderContentReadyKey(activeContentKey);
  }, [activeContentKey]);

  useEffect(() => {
    if (!activeContentItem) return;
    void loadMarkdownContentModule().catch(() => {});
    void activeContentItem.loadBody().catch(() => {});
  }, [activeContentItem]);

  useEffect(() => subscribeCriticalResources({
    key: criticalPageKey,
    label: activeContentItem ? "LOADING READER ASSETS" : "LOADING PROJECT MEDIA",
    images: isNotFound
      ? []
      : [
          ...localizedProjects.map((project) => project.cover),
          ...(activeContentItem?.images ?? []),
        ],
    loaders: activeContentItem
      ? [loadMarkdownContentModule, activeContentItem.loadBody]
      : [],
  }, setCriticalLoad), [activeContentItem, criticalPageKey, isNotFound, localizedProjects]);

  useLayoutEffect(() => {
    if (pathname !== "/" && wechatOpen) setWechatOpen(false);
  }, [pathname, wechatOpen]);

  const pendingReturnScrollYRef = useRef(null);
  const skipHashRestoreRef = useRef(false);
  const projectTransitionContextRef = useRef(null);
  const projectTransitionActiveRef = useRef(false);
  const projectTransitionRuntimeRef = useRef(null);
  const projectTransitionDirectionRef = useRef(null);
  const readerClosePendingRef = useRef(false);
  const articleTriggerRef = useRef(null);
  const wechatTriggerRef = useRef(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const [projectTransitionActive, setProjectTransitionActive] = useState(false);

  const restoreProjectTriggerFocus = useCallback(() => {
    window.requestAnimationFrame(() => {
      const context = projectTransitionContextRef.current;
      const candidates = [
        context?.triggerElement,
        context?.sourceElement?.querySelector(".portfolio-project__open-hit"),
      ];
      const target = candidates.find((element) => (
        element?.isConnected && !element.closest("[inert]")
      ));
      target?.focus({ preventScroll: true });
    });
  }, []);

  const runProjectViewTransition = useCallback(({
    direction,
    sourceElement,
    update,
    restoreFocus = false,
  }) => {
    if (projectTransitionActiveRef.current) {
      return projectTransitionRuntimeRef.current?.transition ?? null;
    }
    if (!canUseProjectViewTransition(sourceElement)) {
      update();
      if (restoreFocus) restoreProjectTriggerFocus();
      return null;
    }

    const root = document.documentElement;
    let updateCommitted = false;
    let finished = false;
    const runtime = {
      direction,
      transition: null,
      finish: null,
      cancelled: false,
    };
    projectTransitionDirectionRef.current = direction;
    projectTransitionActiveRef.current = true;
    flushSync(() => setProjectTransitionActive(true));
    root.dataset.projectTransition = direction;
    if (direction === "opening") sourceElement.style.viewTransitionName = "project-card";

    const finish = ({ skipFocus = false } = {}) => {
      if (finished) return;
      finished = true;
      sourceElement.style.removeProperty("view-transition-name");
      delete root.dataset.projectTransition;
      projectTransitionActiveRef.current = false;
      if (projectTransitionRuntimeRef.current === runtime) {
        projectTransitionRuntimeRef.current = null;
        projectTransitionDirectionRef.current = null;
      }
      if (direction === "closing") readerClosePendingRef.current = false;
      setProjectTransitionActive(false);
      if (restoreFocus && !skipFocus) restoreProjectTriggerFocus();
    };

    runtime.finish = finish;
    projectTransitionRuntimeRef.current = runtime;

    try {
      const transition = document.startViewTransition(() => {
        if (runtime.cancelled || projectTransitionRuntimeRef.current !== runtime) return;
        if (direction === "opening") sourceElement.style.removeProperty("view-transition-name");
        updateCommitted = true;
        flushSync(update);
        if (direction === "closing") sourceElement.style.viewTransitionName = "project-card";
      });
      runtime.transition = transition;
      transition.finished.catch(() => {}).finally(finish);
      return transition;
    } catch {
      if (!updateCommitted && !runtime.cancelled && projectTransitionRuntimeRef.current === runtime) flushSync(update);
      finish();
      return null;
    }
  }, [restoreProjectTriggerFocus]);

  useEffect(() => {
    try {
      window.sessionStorage.removeItem(HARD_RELOAD_INTENT_KEY);
    } catch {
      // Keyboard hard reload detection is optional when storage is unavailable.
    }

    const rememberHardReload = (event) => {
      const modifier = event.ctrlKey || event.metaKey;
      const isHardF5 = modifier && event.key === "F5";
      const isHardReloadShortcut = modifier && event.shiftKey && event.key.toLowerCase() === "r";
      if (!isHardF5 && !isHardReloadShortcut) return;
      try {
        window.sessionStorage.setItem(HARD_RELOAD_INTENT_KEY, String(Date.now()));
      } catch {
        // The page still reloads normally when storage is unavailable.
      }
    };

    window.addEventListener("keydown", rememberHardReload, true);
    return () => window.removeEventListener("keydown", rememberHardReload, true);
  }, []);

  const scrollToCurrentHash = useCallback(() => {
    if (!window.location.hash) return;
    window.requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, []);

  const restoreReaderReturnPosition = useCallback((returnScrollY) => {
    skipHashRestoreRef.current = true;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: returnScrollY, behavior: "auto" });
      });
    });
  }, []);

  const appScrollLocked = readerOpen || wechatDialogOpen || projectTransitionActive;

  useLayoutEffect(() => {
    if (!appScrollLocked) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [appScrollLocked]);

  useEffect(() => {
    const onPopState = (event) => {
      const activeRuntimeAtNavigation = projectTransitionRuntimeRef.current;
      const cancelledOpening = activeRuntimeAtNavigation?.direction === "opening";
      if (activeRuntimeAtNavigation) {
        activeRuntimeAtNavigation.cancelled = true;
        activeRuntimeAtNavigation.transition?.skipTransition?.();
        activeRuntimeAtNavigation.finish({ skipFocus: true });
      }

      const nextPathname = window.location.pathname;
      const nextRoute = parseContentRoute(nextPathname);
      if (activeRuntimeAtNavigation?.direction === "closing") {
        const context = projectTransitionContextRef.current;
        if (nextRoute?.type === "project" && nextRoute.id === context?.projectId) {
          readerClosePendingRef.current = false;
          setPathname(nextPathname);
          return;
        }
      }
      const previousRoute = parseContentRoute(pathnameRef.current);
      const returningFromReader = Boolean(previousRoute) && nextPathname === "/";
      if (returningFromReader) {
        const storedReturnScrollY = Number(event.state?.contentReturnY);
        const returnScrollY = Number.isFinite(pendingReturnScrollYRef.current)
          ? pendingReturnScrollYRef.current
          : storedReturnScrollY;
        pendingReturnScrollYRef.current = null;
        const restoreReturnPosition = () => {
          if (!Number.isFinite(returnScrollY)) return;
          skipHashRestoreRef.current = true;
          window.scrollTo({ top: returnScrollY, behavior: "auto" });
        };

        if (previousRoute?.type === "project") {
          const context = projectTransitionContextRef.current;
          const sourceElement = context?.projectId === previousRoute.id ? context.sourceElement : null;
          if (canUseProjectViewTransition(sourceElement)) {
            readerClosePendingRef.current = true;
            runProjectViewTransition({
              direction: "closing",
              sourceElement,
              restoreFocus: true,
              update: () => {
                restoreReturnPosition();
                setPathname(nextPathname);
              },
            });
            return;
          }
        }

        setPathname(nextPathname);
        readerClosePendingRef.current = false;
        if (Number.isFinite(returnScrollY)) {
          restoreReaderReturnPosition(returnScrollY);
          if (previousRoute?.type === "project") restoreProjectTriggerFocus();
          return;
        }
      }
      setPathname(nextPathname);
      readerClosePendingRef.current = false;
      if (nextPathname === "/") {
        scrollToCurrentHash();
        if (cancelledOpening) restoreProjectTriggerFocus();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [restoreProjectTriggerFocus, restoreReaderReturnPosition, runProjectViewTransition, scrollToCurrentHash]);

  useEffect(() => {
    if (!readerOpen) readerClosePendingRef.current = false;
  }, [readerOpen]);

  useEffect(() => {
    if (booting) return;
    if (pathname !== "/") return;
    if (skipHashRestoreRef.current) {
      skipHashRestoreRef.current = false;
      return;
    }
    scrollToCurrentHash();
  }, [booting, pathname, scrollToCurrentHash]);

  const openContent = useCallback((type, id) => {
    const contentItem = (type === "article" ? localizedArticles : localizedProjects)
      .find((item) => item.id === id);
    if (!contentItem) return;
    void loadMarkdownContentModule().catch(() => {});
    void contentItem.loadBody().catch(() => {});
    readerClosePendingRef.current = false;
    const nextPath = contentRoutePath(type, id);
    const returnScrollY = window.scrollY;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    pendingReturnScrollYRef.current = returnScrollY;
    window.history.replaceState({ ...(window.history.state || {}), contentReturnY: returnScrollY }, "", currentUrl);
    window.history.pushState({ contentOverlay: true }, "", nextPath);
    setPathname(nextPath);
  }, [localizedArticles, localizedProjects]);

  const closeContent = useCallback(() => {
    if (readerClosePendingRef.current) return;
    readerClosePendingRef.current = true;
    const fallbackHash = contentRoute?.type === "project" ? "#projects" : "#contact";
    if (window.history.state?.contentOverlay) {
      window.history.back();
      return;
    }
    window.history.replaceState(null, "", `/${fallbackHash}`);
    setPathname("/");
    window.requestAnimationFrame(() => {
      document.querySelector(fallbackHash)?.scrollIntoView({ behavior: "auto", block: "start" });
      readerClosePendingRef.current = false;
    });
  }, [contentRoute]);

  const goHome = useCallback(() => {
    readerClosePendingRef.current = false;
    window.history.replaceState(null, "", "/");
    setPathname("/");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const openArticle = useCallback((id, triggerElement) => {
    if (projectTransitionActiveRef.current) return;
    articleTriggerRef.current = triggerElement ?? null;
    openContent("article", id);
  }, [openContent]);
  const openProject = useCallback((id, sourceElement, triggerElement) => {
    if (projectTransitionActiveRef.current) return;
    projectTransitionContextRef.current = {
      projectId: id,
      sourceElement,
      triggerElement,
      returnScrollY: window.scrollY,
    };
    if (!canUseProjectViewTransition(sourceElement)) {
      openContent("project", id);
      return;
    }
    runProjectViewTransition({
      direction: "opening",
      sourceElement,
      update: () => openContent("project", id),
    });
  }, [openContent, runProjectViewTransition]);

  const completeOpening = useCallback(() => {
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, "complete");
    } catch {
      // The animation can still finish when storage is unavailable.
    }
    setIntroActive(false);
  }, []);

  const completeBoot = useCallback(() => {
    if (introActive && pathname === "/" && !window.location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    setBooting(false);
  }, [introActive, pathname]);

  const updateSceneLoad = useCallback(({ progress, status = "WARMING SPACE SCENE" } = {}) => {
    setSceneLoad((current) => {
      if (current.forceFallback) return current;
      const nextProgress = Number.isFinite(progress)
        ? Math.max(current.progress, Math.min(1, Math.max(0, progress)))
        : current.progress;
      if (status === current.status && nextProgress === current.progress) return current;
      return { ...current, progress: nextProgress, status };
    });
  }, []);

  const completeSceneLoad = useCallback(({ mode = "bennu" } = {}) => {
    setSceneLoad((current) => current.forceFallback ? current : {
      ...current,
      status: mode === "bennu" ? "SPACE SCENE READY" : "SCENE READY / COMPATIBILITY MODE",
      progress: 1,
      ready: true,
    });
  }, []);

  const forceSceneFallback = useCallback(() => {
    setSceneLoad((current) => current.ready ? current : ({
      status: "SCENE READY / COMPATIBILITY MODE",
      progress: 1,
      ready: true,
      forceFallback: true,
    }));
  }, []);

  const replayOpening = useCallback(() => {
    setIntroRunKey((value) => value + 1);
    setIntroActive(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (pathname !== "/") setIntroActive(false);
  }, [pathname]);

  const criticalLoadMatchesPage = criticalLoad.key === criticalPageKey;
  const pageResourceProgress = criticalLoadMatchesPage ? criticalLoad.progress : 0;
  const readerContentReady = !activeContentKey || readerContentReadyKey === activeContentKey;
  const sceneReadyForPage = isNotFound || sceneLoad.ready;
  const sceneProgressForPage = isNotFound ? 1 : sceneLoad.progress;
  const bootReady = sceneReadyForPage && criticalLoadMatchesPage && criticalLoad.ready && readerContentReady;
  const bootProgress = sceneProgressForPage * 0.58 + pageResourceProgress * 0.42;
  const bootStatus = !sceneReadyForPage
    ? sceneLoad.status
    : !criticalLoadMatchesPage ? "LOADING PAGE ASSETS" : !criticalLoad.ready ? criticalLoad.status : criticalLoad.degraded
      ? criticalLoad.status
      : !readerContentReady ? "RENDERING READER" : sceneLoad.status;
  const sceneEnabled = true;
  const sceneSuspended = readerOpen
    || wechatDialogOpen
    || (projectTransitionActive && projectTransitionDirectionRef.current === "closing");
  const homeIsInert = booting
    || readerOpen
    || wechatDialogOpen
    || (projectTransitionActive && projectTransitionDirectionRef.current === "closing");

  return <>
    {booting && <VibeBootLoader
      ready={bootReady}
      progress={bootProgress}
      status={bootStatus}
      onComplete={completeBoot}
      onTimeout={forceSceneFallback}
    />}
    {isNotFound ? <div aria-hidden={booting ? "true" : undefined} inert={booting ? true : undefined}>
      <NotFoundPage path={pathname} onGoHome={goHome} />
    </div> : <>
      <main id="top" aria-hidden={homeIsInert ? "true" : undefined} inert={homeIsInert ? true : undefined}>
        <VibeCodingOpening
          active={introActive}
          paused={booting}
          runKey={introRunKey}
          onComplete={completeOpening}
          settledTrackVh={portfolioJourneyMetrics.trackVh}
          journeyWaypoints={portfolioJourneyMetrics.waypoints}
          chrome={<PageChrome onReplay={replayOpening} />}
          hero={<HeroSection
            forceSceneFallback={sceneLoad.forceFallback}
            onSceneProgress={updateSceneLoad}
            onSceneReady={completeSceneLoad}
            sceneEnabled={sceneEnabled}
            sceneSuspended={sceneSuspended}
          />}
          journey={<PortfolioJourney
            active={!introActive && !booting}
            suspended={readerOpen
              || wechatDialogOpen
              || (projectTransitionActive && projectTransitionDirectionRef.current === "closing")}
            projects={localizedProjects}
            onOpenProject={openProject}
          />}
        />
        <section className="contact snap-panel" id="contact" aria-labelledby="contact-title">
          <div className="contact__layout">
            <header className="contact__lead">
              <p className="eyebrow">ARTICLES / CONTACT / 04</p>
              <h2 id="contact-title">
                <span>{copy.contact.titleLine1}</span>
                <span>{copy.contact.titleLine2}<em>/</em></span>
              </h2>
            </header>
            <div className="contact__aside">
              <p className="contact__note">{copy.contact.note}</p>
            </div>
            <section className="contact__writing" aria-labelledby="contact-writing-title">
              <div className="contact__writing-heading">
                <h3 id="contact-writing-title">{copy.contact.writingTitle}</h3>
              </div>
              <div className="contact__article-list">
                {localizedArticles.map((article) => <button
                  className="contact__article-link"
                  type="button"
                  aria-haspopup="dialog"
                  onClick={(event) => openArticle(article.id, event.currentTarget)}
                  key={article.id}
                >
                  <span className="contact__article-index" aria-hidden="true">{article.index}</span>
                  <span className="contact__article-copy">
                    <small>{article.category} · {article.readTime}</small>
                    <strong>{article.title}</strong>
                  </span>
                  <ArrowUpRight size={18} aria-hidden="true" />
                </button>)}
              </div>
            </section>
            <div className="contact__links" aria-label={copy.contact.channelsAria}>
              <p className="contact__links-title">{copy.contact.linksTitle}</p>
              <a href={`mailto:${profile.email}`}><EnvelopeSimple size={22} aria-hidden="true" /><span><small>EMAIL</small>{profile.email}</span></a>
              <a href={profile.github.url} target="_blank" rel="noreferrer"><GithubLogo size={22} aria-hidden="true" /><span><small>GITHUB</small>{profile.github.label}</span></a>
              <button className="contact__wechat-id" type="button" aria-haspopup="dialog" onClick={(event) => {
                wechatTriggerRef.current = event.currentTarget;
                setWechatOpen(true);
              }}><WechatLogo size={22} aria-hidden="true" /><span><small>WECHAT</small>{profile.wechat.label}</span></button>
            </div>
            <a className="contact__return" href="#top" onClick={handlePageAnchorClick}><span>BACK TO TOP</span><ArrowUpRight size={19} aria-hidden="true" /></a>
          </div>
        </section>
      </main>
      <WechatDialog open={wechatDialogOpen} onClose={() => setWechatOpen(false)} restoreFocusRef={wechatTriggerRef} />
      <ArticleReader article={activeArticle} interactive={!booting} onClose={closeContent} onContentReady={markReaderContentReady} restoreFocusRef={articleTriggerRef} />
      <ProjectReader project={activeProject} interactive={!booting} onClose={closeContent} onContentReady={markReaderContentReady} />
    </>}
  </>;
}
