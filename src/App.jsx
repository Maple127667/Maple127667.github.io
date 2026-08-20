import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import {
  ArrowDown,
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
} from "./content/articles/index.js";
import { profile, technologyGroups } from "./content/profile.js";
import { projects } from "./content/projects/index.js";
import { PortfolioJourney } from "./PortfolioJourney.jsx";
import { getPortfolioJourneyMetrics } from "./portfolioJourneyTimeline.js";
import { VibeCodingOpening } from "./VibeCodingIntro.jsx";
import { VibeBootLoader } from "./VibeBootLoader.jsx";
import StarField from "./StarField.jsx";

let asteroidSceneModulePromise;
const loadAsteroidSceneModule = () => {
  asteroidSceneModulePromise ??= import("./AsteroidScene.jsx");
  return asteroidSceneModulePromise;
};
const LazyAsteroidScene = lazy(loadAsteroidSceneModule);
const INTRO_SESSION_KEY = "maple-vibe-opening-v1";
const HARD_RELOAD_INTENT_KEY = "maple-vibe-hard-reload-intent";
const HARD_RELOAD_INTENT_TTL_MS = 15000;

const sectionRailItems = [
  { id: "top", number: "01", label: "首页" },
  { id: "projects", number: "02", label: "作品" },
  { id: "stack", number: "03", label: "技术栈" },
  { id: "contact", number: "04", label: "联系" },
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
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--scroll-progress", `${max > 0 ? Math.min(1, window.scrollY / max) : 0}`);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(document.body);
    return () => {
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

function DeferredAsteroidScene({ forceFallback, onProgress, onReady }) {
  if (forceFallback) return <AsteroidSceneFallback compatibility />;
  return <AsteroidSceneBoundary onProgress={onProgress} onReady={onReady}>
    <Suspense fallback={<AsteroidSceneFallback />}>
      <LazyAsteroidScene onProgress={onProgress} onReady={onReady} />
    </Suspense>
  </AsteroidSceneBoundary>;
}

function SectionRail() {
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

  return <nav className="hero-rail" aria-label="页面进度">
    {sectionRailItems.map((item) => <a key={item.id} href={`#${item.id}`} onClick={handlePageAnchorClick} aria-label={`${item.number} ${item.label}`} aria-current={activeSection === item.id ? "location" : undefined} className={activeSection === item.id ? "is-active" : ""}>{item.number}</a>)}
    <ArrowDown size={17} aria-hidden="true" />
  </nav>;
}

function Header({ onReplay }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  const navigate = (event) => {
    close();
    handlePageAnchorClick(event);
  };
  return <header className="site-header">
    <a className="wordmark" href="#top" onClick={handlePageAnchorClick} aria-label="Maple 首页">MAPLE <span aria-hidden="true" /></a>
    <button className="menu-toggle" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="site-navigation" aria-label={menuOpen ? "关闭菜单" : "打开菜单"}>{menuOpen ? <X size={22} /> : <List size={22} />}</button>
    <nav id="site-navigation" className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label="主导航"><a href="#top" onClick={navigate}>关于我</a><a href="#projects" onClick={navigate}>作品</a><a href="#stack" onClick={navigate}>技术栈</a><a href="#contact" onClick={navigate}>联系</a>{onReplay && <button className="site-nav__replay" type="button" onClick={() => { close(); onReplay(); }}>重播构建</button>}</nav>
    <span className="scroll-meter" aria-hidden="true" />
  </header>;
}

function HeroSection({ forceSceneFallback, onSceneProgress, onSceneReady }) {
  return <section className="hero snap-panel" aria-labelledby="hero-title">
    <StarField />
    <div className="hero__copy"><p className="eyebrow">{profile.name.toUpperCase()} / PORTFOLIO + NOTES 2026</p><h1 id="hero-title"><span className="hero__name">{profile.name.toUpperCase()} <em>/</em></span><span className="hero__role-lockup"><span className="hero__role-en">CREATIVE DEVELOPER</span><span className="hero__role-cn">创意开发者<br />AI 应用与 Agent 系统</span></span></h1><p className="hero__statement">{profile.heroStatement[0]}<br />{profile.heroStatement[1]}</p><p className="availability"><span aria-hidden="true" />{profile.availability}</p><a className="primary-button" href="#projects" onClick={handlePageAnchorClick}>查看作品 <ArrowUpRight size={18} weight="bold" aria-hidden="true" /></a><p className="location">{profile.location}<br />© {profile.name.toUpperCase()} 2026</p></div>
    <div className="hero__visual"><DeferredAsteroidScene forceFallback={forceSceneFallback} onProgress={onSceneProgress} onReady={onSceneReady} /></div>
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
    <div className="project__image-wrap"><img src={project.cover} alt={`${project.title}项目视觉`} className="project__image" loading="lazy" fetchPriority="low" /></div>
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
      <button type="button" className="read-button" aria-haspopup="dialog" onClick={() => onOpenArticle(article.id)}>进入阅读模式 <ArrowUpRight size={18} aria-hidden="true" /></button>
    </div>
  </aside>;
}

function ProjectArchive({ items, onOpenProject }) {
  return <div className="project-archive snap-panel" aria-label="更多项目">
    <div className="project-archive__heading"><p>更多项目 / MORE WORK</p><span>能力的宽度，不需要重复同一种音量。</span></div>
    <div className={`project-archive__grid${items.length === 1 ? " project-archive__grid--single" : ""}`}>
      {items.map((project) => <article className={`project-card project-card--${project.id}`} key={project.id} aria-labelledby={`project-${project.id}`}>
        <div className="project-card__image"><img src={project.cover} alt={`${project.title}项目视觉`} loading="lazy" /></div>
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
        <button type="button" className="read-button" aria-haspopup="dialog" onClick={() => onOpenArticle(featuredArticle.id)}>阅读全文 <ArrowUpRight size={18} aria-hidden="true" /></button>
      </article>
      <div className="notes__index" aria-label="文章索引">
        <p className="notes__index-title">其余文章 / INDEX</p>
        {otherArticles.map((article) => <button className="article-index" type="button" aria-haspopup="dialog" onClick={() => onOpenArticle(article.id)} key={article.id}>
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

function useReaderDialog(isOpen, onClose, closeRef) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...document.querySelectorAll(".content-reader button, .content-reader a")].filter((element) => !element.hasAttribute("disabled"));
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
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [isOpen, onClose, closeRef]);
}

function ContentsIndex({ headings }) {
  return <aside><span>CONTENTS</span><ol>{headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`}>{heading.title}</a></li>)}</ol></aside>;
}

function remarkHeadingIndexes() {
  return (tree) => {
    let headingIndex = 0;

    visit(tree, "heading", (node) => {
      if (node.depth !== 2) return;
      node.data = node.data ?? {};
      node.data.hProperties = {
        ...node.data.hProperties,
        "data-heading-index": headingIndex,
      };
      headingIndex += 1;
    });
  };
}

function MarkdownContent({ content, headings, endLabel }) {
  const [lightboxImage, setLightboxImage] = useState(null);
  const lightboxCloseRef = useRef(null);

  useEffect(() => {
    if (!lightboxImage) return undefined;
    const reader = document.querySelector(".article-reader");
    const previousReaderOverflow = reader?.style.overflow;
    const previousReaderScrollTop = reader?.scrollTop ?? 0;
    const previousFocus = document.activeElement;
    if (reader) reader.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => lightboxCloseRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setLightboxImage(null);
      } else if (event.key === "Tab") {
        event.preventDefault();
        event.stopImmediatePropagation();
        lightboxCloseRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown, true);
      if (reader) reader.style.overflow = previousReaderOverflow ?? "";
      window.requestAnimationFrame(() => {
        if (reader) reader.scrollTo({ top: previousReaderScrollTop, behavior: "auto" });
        previousFocus?.focus?.({ preventScroll: true });
      });
    };
  }, [lightboxImage]);

  const markdownComponents = {
    h2({ children, node }) {
      const rawIndex = node?.properties?.dataHeadingIndex ?? node?.properties?.["data-heading-index"];
      const headingIndex = Number(rawIndex);
      const safeIndex = Number.isInteger(headingIndex) && headingIndex >= 0 ? headingIndex : 0;
      const heading = headings[safeIndex];
      const number = String(safeIndex + 1).padStart(2, "0");
      return <h2 id={heading?.id}><span aria-hidden="true">{number}</span>{children}</h2>;
    },
    a({ href = "", children, ...props }) {
      const isExternal = /^https?:\/\//.test(href);
      return <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} {...props}>{children}</a>;
    },
    img({ src = "", alt = "" }) {
      return <button className="article-image-button" type="button" onClick={() => setLightboxImage({ src, alt })} aria-label={`放大图片：${alt || "文章插图"}`}>
        <img src={src} alt={alt} loading="lazy" />
      </button>;
    },
  };

  return <div className="article-reader__prose">
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkHeadingIndexes]} components={markdownComponents}>{content}</ReactMarkdown>
    <footer>{endLabel}</footer>
    {lightboxImage && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={lightboxImage.alt ? `图片预览：${lightboxImage.alt}` : "图片预览"} onMouseDown={(event) => {
      if (event.target === event.currentTarget) setLightboxImage(null);
    }}>
      <div className="image-lightbox__panel">
        <button ref={lightboxCloseRef} className="image-lightbox__close" type="button" onClick={() => setLightboxImage(null)} aria-label="关闭图片预览"><X size={23} aria-hidden="true" /></button>
        <img src={lightboxImage.src} alt={lightboxImage.alt} />
        {lightboxImage.alt && <p>{lightboxImage.alt}</p>}
      </div>
    </div>}
  </div>;
}

function ArticleReader({ article, onClose }) {
  const closeRef = useRef(null);
  useReaderDialog(Boolean(article), onClose, closeRef);

  if (!article) return null;

  return <div className="article-reader content-reader" role="dialog" aria-modal="true" aria-labelledby="article-reader-title">
    <div className="article-reader__bar">
      <p>MAPLE / FIELD NOTES / {article.index}</p>
      <button ref={closeRef} type="button" onClick={onClose} aria-label="关闭文章"><span>返回主页</span><X size={21} aria-hidden="true" /></button>
    </div>
    <article className="article-reader__document">
      <header className="article-reader__head">
        <p>{article.category}<br />{formatArticleDate(article.date)}<br />{article.readTime}</p>
        <div><span>ARTICLE / {article.index}</span><h2 id="article-reader-title">{article.title}</h2><p>{article.excerpt}</p></div>
      </header>
      <div className="article-reader__body">
        <ContentsIndex headings={article.headings} />
        <MarkdownContent content={article.body} headings={article.headings} endLabel={`END OF ARTICLE / ${article.index}`} />
      </div>
    </article>
  </div>;
}

function ProjectReader({ project, onClose }) {
  const closeRef = useRef(null);
  useReaderDialog(Boolean(project), onClose, closeRef);

  if (!project) return null;

  return <div className="article-reader project-reader content-reader" role="dialog" aria-modal="true" aria-labelledby="project-reader-title">
    <div className="article-reader__bar">
      <p>MAPLE / PROJECT / {project.index}</p>
      <button ref={closeRef} type="button" onClick={onClose} aria-label="关闭项目"><span>返回主页</span><X size={21} aria-hidden="true" /></button>
    </div>
    <article className="article-reader__document">
      <header className="article-reader__head project-reader__head">
        <p>{project.category}<br />{project.year}<br />PROJECT {project.index}</p>
        <div>
          <span>SELECTED WORK / {project.index}</span>
          {project.status && <p className="project-reader__status"><i aria-hidden="true" />{project.status}</p>}
          <h2 id="project-reader-title">{project.headline}</h2>
          <p>{project.excerpt}</p>
        </div>
      </header>
      <figure className={`project-reader__cover project-reader__cover--${project.id}`}><img src={project.cover} alt={`${project.title}项目视觉`} /></figure>
      <div className="project-reader__external"><ProjectExternalLink project={project} /></div>
      <div className="article-reader__body">
        <ContentsIndex headings={project.headings} />
        <MarkdownContent content={project.body} headings={project.headings} endLabel={`END OF PROJECT / ${project.index}`} />
      </div>
    </article>
  </div>;
}

function NotFoundPage({ path, onGoHome }) {
  return <main className="not-found" aria-labelledby="not-found-title">
    <div className="not-found__orbit" aria-hidden="true"><span /><span /><span /></div>
    <header className="not-found__header"><button type="button" onClick={onGoHome} aria-label="返回 Maple 首页">MAPLE <i aria-hidden="true" /></button><span>ERROR / 404</span></header>
    <div className="not-found__content">
      <p className="not-found__eyebrow">404 / LOST IN ORBIT</p>
      <h1 id="not-found-title">这里没有<br />可抵达的轨道。</h1>
      <p>这个地址不存在，或者对应的文章与项目已经移动。</p>
      <code>{path}</code>
      <button className="not-found__action" type="button" onClick={onGoHome}>返回首页 <ArrowRight size={19} weight="bold" aria-hidden="true" /></button>
    </div>
    <p className="not-found__status">SYSTEM STATUS / ROUTE NOT FOUND</p>
  </main>;
}

function WechatDialog({ open, onClose }) {
  const closeRef = useRef(null);
  useReaderDialog(open, onClose, closeRef);

  if (!open) return null;

  return <div
    className="wechat-dialog content-reader"
    role="dialog"
    aria-modal="true"
    aria-label="微信二维码"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <div className="wechat-dialog__panel">
      <button ref={closeRef} className="wechat-dialog__close" type="button" onClick={onClose} aria-label="关闭微信二维码">
        <X size={21} aria-hidden="true" />
      </button>
      <p className="wechat-dialog__eyebrow">WECHAT / CONTACT</p>
      <figure className="contact__qr">
        <div><img src={profile.wechat.qr} alt={`微信 ${profile.wechat.label} 的二维码`} /></div>
        <figcaption><WechatLogo size={18} aria-hidden="true" /><span>微信号<strong>{profile.wechat.label}</strong></span></figcaption>
      </figure>
    </div>
  </div>;
}
export function App() {
  useScrollProgress();
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [wechatOpen, setWechatOpen] = useState(false);
  const [hardReloadIntent] = useState(hasFreshHardReloadIntent);
  const [booting, setBooting] = useState(true);
  const [sceneLoad, setSceneLoad] = useState({
    status: "LOADING SPACE RUNTIME",
    ready: false,
    forceFallback: false,
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
  const activeArticle = contentRoute?.type === "article" ? articles.find((article) => article.id === contentRoute.id) || null : null;
  const activeProject = contentRoute?.type === "project" ? projects.find((project) => project.id === contentRoute.id) || null : null;
  const readerOpen = Boolean(activeArticle || activeProject);
  const isNotFound = pathname !== "/" && (!contentRoute || !readerOpen);

  const pendingReturnScrollYRef = useRef(null);
  const skipHashRestoreRef = useRef(false);

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

  useEffect(() => {
    const onPopState = (event) => {
      const nextPathname = window.location.pathname;
      const returningFromReader = Boolean(parseContentRoute(pathname)) && nextPathname === "/";
      setPathname(nextPathname);
      if (returningFromReader) {
        const storedReturnScrollY = Number(event.state?.contentReturnY);
        const returnScrollY = Number.isFinite(pendingReturnScrollYRef.current)
          ? pendingReturnScrollYRef.current
          : storedReturnScrollY;
        pendingReturnScrollYRef.current = null;
        if (Number.isFinite(returnScrollY)) {
          restoreReaderReturnPosition(returnScrollY);
          return;
        }
      }
      if (nextPathname === "/") scrollToCurrentHash();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname, restoreReaderReturnPosition, scrollToCurrentHash]);

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
    const nextPath = contentRoutePath(type, id);
    const returnScrollY = window.scrollY;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    pendingReturnScrollYRef.current = returnScrollY;
    window.history.replaceState({ ...(window.history.state || {}), contentReturnY: returnScrollY }, "", currentUrl);
    window.history.pushState({ contentOverlay: true }, "", nextPath);
    setPathname(nextPath);
  }, []);

  const closeContent = useCallback(() => {
    const fallbackHash = contentRoute?.type === "project" ? "#projects" : "#notes";
    if (window.history.state?.contentOverlay) {
      window.history.back();
      return;
    }
    window.history.replaceState(null, "", `/${fallbackHash}`);
    setPathname("/");
    window.requestAnimationFrame(() => {
      document.querySelector(fallbackHash)?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [contentRoute]);

  const goHome = useCallback(() => {
    window.history.replaceState(null, "", "/");
    setPathname("/");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const openArticle = useCallback((id) => openContent("article", id), [openContent]);
  const openProject = useCallback((id) => openContent("project", id), [openContent]);

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

  const updateSceneLoad = useCallback(({ status = "WARMING SPACE SCENE" } = {}) => {
    setSceneLoad((current) => {
      if (current.forceFallback) return current;
      if (status === current.status) return current;
      return { ...current, status };
    });
  }, []);

  const completeSceneLoad = useCallback(({ mode = "bennu" } = {}) => {
    setSceneLoad((current) => current.forceFallback ? current : {
      ...current,
      status: mode === "bennu" ? "SPACE SCENE READY" : "SCENE READY / COMPATIBILITY MODE",
      ready: true,
    });
  }, []);

  const forceSceneFallback = useCallback(() => {
    setSceneLoad({
      status: "SCENE READY / COMPATIBILITY MODE",
      ready: true,
      forceFallback: true,
    });
  }, []);

  const replayOpening = useCallback(() => {
    setIntroRunKey((value) => value + 1);
    setIntroActive(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (pathname !== "/") setIntroActive(false);
  }, [pathname]);

  const bootReady = pathname !== "/" || sceneLoad.ready;

  return <>
    {booting && <VibeBootLoader
      ready={bootReady}
      status={pathname === "/" ? sceneLoad.status : "INTERFACE READY"}
      onComplete={completeBoot}
      onTimeout={pathname === "/" ? forceSceneFallback : undefined}
    />}
    {isNotFound ? <div aria-hidden={booting ? "true" : undefined} inert={booting ? true : undefined}>
      <NotFoundPage path={pathname} onGoHome={goHome} />
    </div> : <main id="top" aria-hidden={booting ? "true" : undefined} inert={booting ? true : undefined}>
    <VibeCodingOpening
      active={introActive}
      paused={booting}
      runKey={introRunKey}
      onComplete={completeOpening}
      settledTrackVh={portfolioJourneyMetrics.trackVh}
      journeyWaypoints={portfolioJourneyMetrics.waypoints}
      chrome={<><Header onReplay={replayOpening} /><SectionRail /></>}
      hero={<HeroSection forceSceneFallback={sceneLoad.forceFallback} onSceneProgress={updateSceneLoad} onSceneReady={completeSceneLoad} />}
      journey={<PortfolioJourney active={!introActive && !booting} projects={projects} onOpenProject={openProject} />}
    />
    <section className="contact snap-panel" id="contact" aria-labelledby="contact-title">
      <div className="contact__layout">
        <header className="contact__lead">
          <p className="eyebrow">CONTACT / 04 / OPEN CHANNEL</p>
          <h2 id="contact-title">下一条路径，<br />从你的问题开始 <em>/</em></h2>
        </header>
        <div className="contact__aside">
          <p className="contact__note">如果你正在构建 Agent、检索系统，或一个还没有被定义好的产品，我们可以从问题本身开始。</p>
        </div>
        <div className="contact__links" aria-label="联系渠道">
          <a href={`mailto:${profile.email}`}><EnvelopeSimple size={22} aria-hidden="true" /><span><small>EMAIL</small>{profile.email}</span></a>
          <a href={profile.github.url} target="_blank" rel="noreferrer"><GithubLogo size={22} aria-hidden="true" /><span><small>GITHUB</small>{profile.github.label}</span></a>
          <button className="contact__wechat-id" type="button" aria-haspopup="dialog" onClick={() => setWechatOpen(true)}><WechatLogo size={22} aria-hidden="true" /><span><small>WECHAT</small>{profile.wechat.label}</span></button>
        </div>
        <a className="contact__return" href="#top" onClick={handlePageAnchorClick}><span>BACK TO TOP</span><ArrowUpRight size={19} aria-hidden="true" /></a>
      </div>
    </section>
    <WechatDialog open={wechatOpen} onClose={() => setWechatOpen(false)} />
    <ArticleReader article={booting ? null : activeArticle} onClose={closeContent} />
    <ProjectReader project={booting ? null : activeProject} onClose={closeContent} />
  </main>}
  </>;
}
