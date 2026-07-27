import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  EnvelopeSimple,
  GithubLogo,
  List,
  X,
} from "@phosphor-icons/react";
import {
  articles,
  featuredArticle,
  formatArticleDate,
} from "./content/articles/index.js";
import { profile, technologyGroups } from "./content/profile.js";
import { projects } from "./content/projects/index.js";

const LazyAsteroidScene = lazy(() => import("./AsteroidScene.jsx"));

const sectionRailItems = [
  { id: "top", number: "01", label: "首页" },
  { id: "projects", number: "02", label: "作品" },
  { id: "about", number: "03", label: "关于" },
  { id: "notes", number: "04", label: "文章" },
  { id: "contact", number: "05", label: "联系" },
];

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

function useFullPageSnap(enabled) {
  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      root.dataset.snapPaused = "true";
      return () => { delete root.dataset.snapPaused; };
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const getPanels = () => [...document.querySelectorAll(".snap-panel")];
    const panelTop = (panel) => panel.getBoundingClientRect().top + window.scrollY;
    const nearestIndex = () => {
      const panels = getPanels();
      let nearest = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      panels.forEach((panel, index) => {
        const distance = Math.abs(panel.getBoundingClientRect().top);
        if (distance < nearestDistance) {
          nearest = index;
          nearestDistance = distance;
        }
      });
      return nearest;
    };
    const clampIndex = (index) => Math.max(0, Math.min(getPanels().length - 1, index));

    let lockedUntil = 0;
    let unlockTimer;
    let settleTimer;
    let resizeTimer;
    let wheelDistance = 0;
    let gestureIndex = null;
    let touchStartY = 0;
    let touchDistance = 0;
    let touchIndex = null;
    let touchTracking = false;

    const setSnapMetadata = (index) => {
      root.dataset.snapPanels = String(getPanels().length);
      root.dataset.snapIndex = String(index);
      root.dataset.snapThreshold = String(Math.round(Math.max(88, window.innerHeight * 0.12)));
    };

    const snapTo = (requestedIndex) => {
      const panels = getPanels();
      if (!panels.length) return;
      const index = Math.max(0, Math.min(panels.length - 1, requestedIndex));
      window.clearTimeout(unlockTimer);
      window.clearTimeout(settleTimer);
      root.classList.remove("is-snap-gesturing");
      wheelDistance = 0;
      gestureIndex = null;
      touchDistance = 0;
      touchIndex = null;
      const duration = reduceMotion ? 40 : 680;
      lockedUntil = window.performance.now() + duration;
      panels[index].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      setSnapMetadata(index);
      unlockTimer = window.setTimeout(() => { lockedUntil = 0; }, duration);
    };

    const previewGesture = (index, distance, strength = 0.24) => {
      const panels = getPanels();
      const panel = panels[clampIndex(index)];
      if (!panel) return;
      const limit = Math.min(118, window.innerHeight * 0.15);
      const offset = Math.max(-limit, Math.min(limit, distance * strength));
      root.classList.add("is-snap-gesturing");
      window.scrollTo(0, panelTop(panel) + offset);
    };

    const isReaderEvent = (event) => event.target?.closest?.(".article-reader");
    const onWheel = (event) => {
      if (isReaderEvent(event) || event.ctrlKey) return;
      event.preventDefault();
      if (window.performance.now() < lockedUntil) return;
      if (gestureIndex === null) gestureIndex = nearestIndex();
      const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      wheelDistance += event.deltaY * multiplier;
      const threshold = Math.max(88, window.innerHeight * 0.12);
      previewGesture(gestureIndex, wheelDistance);
      window.clearTimeout(settleTimer);
      if (Math.abs(wheelDistance) >= threshold) {
        const direction = wheelDistance > 0 ? 1 : -1;
        snapTo(gestureIndex + direction);
      } else {
        const returnIndex = gestureIndex;
        settleTimer = window.setTimeout(() => snapTo(returnIndex), 150);
      }
    };

    const onTouchStart = (event) => {
      if (isReaderEvent(event) || event.touches.length !== 1 || window.performance.now() < lockedUntil) return;
      touchStartY = event.touches[0].clientY;
      touchDistance = 0;
      touchIndex = nearestIndex();
      touchTracking = true;
    };

    const onTouchMove = (event) => {
      if (!touchTracking || isReaderEvent(event) || event.touches.length !== 1) return;
      touchDistance = touchStartY - event.touches[0].clientY;
      if (Math.abs(touchDistance) > 4 && event.cancelable) event.preventDefault();
      previewGesture(touchIndex, touchDistance, 0.32);
    };

    const onTouchEnd = () => {
      if (!touchTracking) return;
      touchTracking = false;
      const threshold = Math.max(62, window.innerHeight * 0.1);
      const direction = touchDistance > 0 ? 1 : -1;
      snapTo(Math.abs(touchDistance) >= threshold ? touchIndex + direction : touchIndex);
    };

    const onKeyDown = (event) => {
      if (document.querySelector(".article-reader")) return;
      if (event.target?.closest?.("a, button, input, textarea, select, [contenteditable='true']")) return;
      const current = nearestIndex();
      let next = null;
      if (["ArrowDown", "PageDown"].includes(event.key)) next = current + 1;
      if (["ArrowUp", "PageUp"].includes(event.key)) next = current - 1;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = getPanels().length - 1;
      if (next === null) return;
      event.preventDefault();
      snapTo(next);
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => snapTo(nearestIndex()), 120);
    };

    setSnapMetadata(nearestIndex());
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(unlockTimer);
      window.clearTimeout(settleTimer);
      window.clearTimeout(resizeTimer);
      root.classList.remove("is-snap-gesturing");
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      delete root.dataset.snapPanels;
      delete root.dataset.snapIndex;
      delete root.dataset.snapThreshold;
    };
  }, [enabled]);
}
function AsteroidSceneFallback() {
  return <div className="asteroid-stage asteroid-loading" aria-hidden="true"><span className="scene-label scene-label--top">GRAVITY FIELD / INITIALIZING</span><span className="scene-label scene-label--bottom">THREE-BODY / STANDBY</span></div>;
}

function DeferredAsteroidScene() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => setReady(true), { timeout: 1000 });
      return () => window.cancelIdleCallback(idleId);
    }
    const timer = window.setTimeout(() => setReady(true), 220);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return <AsteroidSceneFallback />;

  return <Suspense fallback={<AsteroidSceneFallback />}><LazyAsteroidScene /></Suspense>;
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
    {sectionRailItems.map((item) => <a key={item.id} href={`#${item.id}`} aria-label={`${item.number} ${item.label}`} aria-current={activeSection === item.id ? "location" : undefined} className={activeSection === item.id ? "is-active" : ""}>{item.number}</a>)}
    <ArrowDown size={17} aria-hidden="true" />
  </nav>;
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  return <header className="site-header">
    <a className="wordmark" href="#top" aria-label="Maple 首页">MAPLE <span aria-hidden="true" /></a>
    <button className="menu-toggle" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="site-navigation" aria-label={menuOpen ? "关闭菜单" : "打开菜单"}>{menuOpen ? <X size={22} /> : <List size={22} />}</button>
    <nav id="site-navigation" className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label="主导航"><a href="#projects" onClick={close}>作品</a><a href="#about" onClick={close}>关于</a><a href="#notes" onClick={close}>文章</a><a href="#contact" onClick={close}>联系</a></nav>
    <span className="scroll-meter" aria-hidden="true" />
  </header>;
}

function ProjectSection({ project, onOpenProject }) {
  return <article className={`project project--${project.align} project--${project.id}`} aria-labelledby={`project-${project.id}`}>
    <div className="project__image-wrap"><img src={project.cover} alt={`${project.title}项目视觉`} className="project__image" loading={project.index === "01" ? "eager" : "lazy"} /></div>
    <div className="project__copy">
      <span className="project__number">{project.index}</span>
      <p className="project__kicker">{project.category}</p>
      <h3 id={`project-${project.id}`}>{project.title}</h3>
      <div className="project__meta-line">
        <p className="project__year">{project.year}</p>
        {project.status && <p className="project__status"><i aria-hidden="true" />{project.status}</p>}
      </div>
      <p className="project__description">{project.excerpt}</p>
      <button type="button" className="text-link" aria-haspopup="dialog" onClick={() => onOpenProject(project.id)}>查看项目 <ArrowRight size={17} weight="bold" aria-hidden="true" /></button>
    </div>
  </article>;
}

function FeaturedEssayInterlude({ article, onOpenArticle }) {
  return <aside className="featured-note snap-panel" aria-labelledby="featured-note-title">
    <div className="featured-note__meta">
      <p>FEATURED ESSAY / {article.index}</p>
      <span>{article.category}</span>
      <span>{formatArticleDate(article.date)}</span>
      <span>{article.readTime}</span>
    </div>
    <div className="featured-note__content">
      <p className="featured-note__eyebrow">作品之间，换一种速度</p>
      <h3 id="featured-note-title">{article.title}</h3>
      <p>{article.excerpt}</p>
      <button type="button" className="read-button" aria-haspopup="dialog" onClick={() => onOpenArticle(article.id)}>进入阅读模式 <ArrowUpRight size={18} aria-hidden="true" /></button>
    </div>
  </aside>;
}

function ProjectArchive({ items, onOpenProject }) {
  return <div className="project-archive snap-panel" aria-label="更多项目">
    <div className="project-archive__heading"><p>更多项目 / MORE WORK</p><span>能力的宽度，不需要重复同一种音量。</span></div>
    <div className="project-archive__grid">
      {items.map((project) => <article className="project-card" key={project.id} aria-labelledby={`project-${project.id}`}>
        <div className="project-card__image"><img src={project.cover} alt={`${project.title}项目视觉`} loading="lazy" /></div>
        <div className="project-card__copy"><span>{project.index} / {project.year}</span><p>{project.category}</p><h3 id={`project-${project.id}`}>{project.title}</h3><p>{project.excerpt}</p><button type="button" className="text-link" aria-haspopup="dialog" onClick={() => onOpenProject(project.id)}>查看项目 <ArrowRight size={16} aria-hidden="true" /></button></div>
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
      previousFocus?.focus?.();
    };
  }, [isOpen, onClose, closeRef]);
}

function ContentsIndex({ headings }) {
  const scrollToHeading = (event, headingId) => {
    event.preventDefault();
    document.getElementById(headingId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return <aside><span>CONTENTS</span><ol>{headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`} onClick={(event) => scrollToHeading(event, heading.id)}>{heading.title}</a></li>)}</ol></aside>;
}

function MarkdownContent({ content, headings, endLabel }) {
  let headingCursor = 0;
  const markdownComponents = {
    h2({ children }) {
      const heading = headings[headingCursor];
      const number = String(headingCursor + 1).padStart(2, "0");
      headingCursor += 1;
      return <h2 id={heading?.id}><span aria-hidden="true">{number}</span>{children}</h2>;
    },
    a({ href = "", children, ...props }) {
      const isExternal = /^https?:\/\//.test(href);
      return <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} {...props}>{children}</a>;
    },
  };

  return <div className="article-reader__prose">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
    <footer>{endLabel}</footer>
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
          <h2 id="project-reader-title">{project.title}</h2>
          <p>{project.excerpt}</p>
        </div>
      </header>
      <figure className="project-reader__cover"><img src={project.cover} alt={`${project.title}项目视觉`} /></figure>
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

export function App() {
  useScrollProgress();
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const contentRoute = parseContentRoute(pathname);
  const activeArticle = contentRoute?.type === "article" ? articles.find((article) => article.id === contentRoute.id) || null : null;
  const activeProject = contentRoute?.type === "project" ? projects.find((project) => project.id === contentRoute.id) || null : null;
  const readerOpen = Boolean(activeArticle || activeProject);
  const isNotFound = pathname !== "/" && (!contentRoute || !readerOpen);
  useFullPageSnap(!readerOpen && !isNotFound);

  const scrollToCurrentHash = useCallback(() => {
    if (!window.location.hash) return;
    window.requestAnimationFrame(() => {
      document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
      if (window.location.pathname === "/") scrollToCurrentHash();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [scrollToCurrentHash]);

  useEffect(() => {
    if (pathname === "/") scrollToCurrentHash();
  }, [pathname, scrollToCurrentHash]);

  const openContent = useCallback((type, id) => {
    const nextPath = contentRoutePath(type, id);
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

  if (isNotFound) return <NotFoundPage path={pathname} onGoHome={goHome} />;

  return <main id="top">
    <Header />
    <SectionRail />
    <section className="hero snap-panel" aria-labelledby="hero-title">
      <div className="hero__copy"><p className="eyebrow">{profile.name.toUpperCase()} / PORTFOLIO + NOTES 2026</p><h1 id="hero-title">{profile.name.toUpperCase()} <em>/</em><br />CREATIVE<br />DEVELOPER</h1><p className="hero__statement">{profile.heroStatement[0]}<br />{profile.heroStatement[1]}</p><p className="availability"><span aria-hidden="true" />{profile.availability}</p><a className="primary-button" href="#projects">查看作品 <ArrowUpRight size={18} weight="bold" aria-hidden="true" /></a><p className="location">{profile.location}<br />© {profile.name.toUpperCase()} 2026</p></div>
      <div className="hero__visual"><DeferredAsteroidScene /></div>
    </section>
    <section className="projects" id="projects" aria-labelledby="works-title">
      <div className="project-panel snap-panel">
        <div className="section-heading"><p id="works-title"><span aria-hidden="true" /> 我的项目</p><a href="#contact">VIEW ALL WORKS <ArrowRight size={17} aria-hidden="true" /></a></div>
        <ProjectSection project={projects[0]} onOpenProject={openProject} />
      </div>
      <FeaturedEssayInterlude article={featuredArticle} onOpenArticle={openArticle} />
      <div className="project-panel snap-panel"><ProjectSection project={projects[1]} onOpenProject={openProject} /></div>
      <ProjectArchive items={projects.slice(2)} onOpenProject={openProject} />
    </section>
    <ProfileSection />
    <NotesSection onOpenArticle={openArticle} />
    <section className="contact snap-panel" id="contact" aria-labelledby="contact-title"><p className="eyebrow">CONTACT / 05 / SAY HELLO</p><h2 id="contact-title">一起做点有意思的事 <em>/</em></h2><p>如果你有想法或项目，欢迎随时联系我。</p><div className="contact__links"><a href={`mailto:${profile.email}`}><EnvelopeSimple size={22} aria-hidden="true" />{profile.email}</a><a href={profile.github.url} target="_blank" rel="noreferrer"><GithubLogo size={22} aria-hidden="true" />{profile.github.label}</a></div><a className="contact__arrow" href="#top" aria-label="返回顶部"><ArrowUpRight size={32} aria-hidden="true" /></a></section>
    <ArticleReader article={activeArticle} onClose={closeContent} />
    <ProjectReader project={activeProject} onClose={closeContent} />
  </main>;
}
