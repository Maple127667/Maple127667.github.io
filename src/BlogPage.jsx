import { useEffect, useRef, useState } from "react";
import "./blog.css";
import { BLOG_POSTS } from "./content/blogPosts.js";
import { handlePageAnchorClick } from "./pageAnchorNavigation.js";

const BLOG_THEME_KEY = "maple-blog-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";

  try {
    const savedTheme = window.localStorage.getItem(BLOG_THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    // Storage can be unavailable in private browsing; the page still works.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function BlogPage({ onBack, onOpenPost, focusOnMount = false }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const headingRef = useRef(null);
  const publishedPosts = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));
  const recentPosts = publishedPosts.slice(0, 3);
  const archiveYears = publishedPosts.reduce((years, post) => {
    const year = post.date.slice(0, 4);
    const existing = years.find((item) => item.year === year);
    if (existing) existing.count += 1;
    else years.push({ year, count: 1 });
    return years;
  }, []);

  useEffect(() => {
    let previousMetadata;
    let active = true;
    const frame = window.requestAnimationFrame(() => {
      if (!active) return;
      const description = document.querySelector('meta[name="description"]');
      previousMetadata = {
        title: document.title,
        language: document.documentElement.lang,
        description: description?.getAttribute("content") ?? null,
      };
      document.title = "Blog — Maple";
      document.documentElement.lang = "zh-CN";
      description?.setAttribute("content", "Maple 的生活记录、兴趣与随想。");
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      if (!previousMetadata) return;
      document.title = previousMetadata.title;
      document.documentElement.lang = previousMetadata.language;
      const description = document.querySelector('meta[name="description"]');
      if (previousMetadata.description === null) description?.removeAttribute("content");
      else description?.setAttribute("content", previousMetadata.description);
    };
  }, []);

  useEffect(() => {
    if (!focusOnMount) return undefined;
    const frame = window.requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusOnMount]);

  useEffect(() => {
    document.documentElement.dataset.blogTheme = theme;
    document.body.dataset.blogTheme = theme;
    return () => {
      delete document.documentElement.dataset.blogTheme;
      delete document.body.dataset.blogTheme;
    };
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);

    try {
      window.localStorage.setItem(BLOG_THEME_KEY, nextTheme);
    } catch {
      // Keep the in-memory theme when persistence is unavailable.
    }
  };

  const handleBack = (event) => {
    if (
      !onBack
      || event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return;
    event.preventDefault();
    onBack();
  };

  const handlePostClick = (event, post) => {
    if (
      !onOpenPost
      || event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) return;
    event.preventDefault();
    onOpenPost(post.slug, event.currentTarget);
  };

  return (
    <main className="blog-page" data-theme={theme} lang="zh-CN">
      <header className="blog-header">
        <div className="blog-wordmark" aria-label="Maple Blog">
          <span className="blog-wordmark__mark">M <i>/</i></span>
          <span className="blog-wordmark__section">BLOG</span>
        </div>

        <div className="blog-header__actions">
          <a className="blog-header__back" href="/" onClick={handleBack}>← 回到作品集</a>
          <button
            className="blog-theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "切换到暗色模式" : "切换到亮色模式"}
          >
            {theme === "light" ? "暗色" : "亮色"}
          </button>
        </div>
      </header>

      <section className="blog-foyer" aria-labelledby="blog-foyer-title">
        <div className="blog-foyer__body">
          <div className="blog-foyer__intro">
            <h1 ref={headingRef} id="blog-foyer-title" tabIndex={-1}>很内向 不敢在大街上抢钱</h1>
            <p className="blog-foyer__copy">
              恭喜你啊，找到了这个页面，就说明你被我恭喜到了，恭喜恭喜
            </p>
            <a className="blog-foyer__enter" href="#blog-directory" onClick={handlePageAnchorClick}>
              这里没有目录 <span aria-hidden="true">→</span>
            </a>
          </div>

          <aside className="blog-foyer__recent" aria-labelledby="recent-blog-title">
            <p id="recent-blog-title">RECENT BLOG</p>
            {recentPosts.length > 0 ? <ol>
              {recentPosts.map((post) => <li key={post.id}>
                <time dateTime={post.date}>{post.date}</time>
                <a
                  href={post.href}
                  data-blog-post-entry={`foyer-${post.slug}`}
                  onClick={(event) => handlePostClick(event, post)}
                >{post.title}</a>
              </li>)}
            </ol> : <p className="blog-foyer__recent-empty">第一篇还在路上。</p>}
          </aside>
        </div>
      </section>

      <section
        className="blog-directory"
        id="blog-directory"
        aria-labelledby="blog-directory-title"
      >
        <div className="blog-directory__layout">
          <div className="blog-directory__content">
            <header className="blog-directory__header">
              <p className="blog-directory__eyebrow">按时间排列</p>
              <h2 id="blog-directory-title">目录</h2>
            </header>

            <div className="blog-directory__index" aria-label="博客文章目录">
              {publishedPosts.length > 0 ? <ol className="blog-directory__posts">
                {publishedPosts.map((post, index) => {
                  const year = post.date.slice(0, 4);
                  const startsYear = index === 0 || publishedPosts[index - 1].date.slice(0, 4) !== year;
                  return <li key={post.id} id={startsYear ? `archive-${year}` : undefined}>
                    <article>
                      <time dateTime={post.date}>{post.date}</time>
                      <div>
                        <h3><a
                          href={post.href}
                          data-blog-post-entry={`directory-${post.slug}`}
                          onClick={(event) => handlePostClick(event, post)}
                        >{post.title}</a></h3>
                        {post.excerpt && <p>{post.excerpt}</p>}
                      </div>
                      <span>{post.kind || "随笔"}</span>
                    </article>
                  </li>;
                })}
              </ol> : <div className="blog-directory__empty" role="status">
                <p>暂时空着</p>
                <h3>第一篇还在慢慢写。</h3>
                <p>等它真的写完，就会从这里开始。</p>
              </div>}
            </div>
          </div>

          <aside className="blog-directory__rail" aria-label="博客辅助导航">
            <section aria-labelledby="directory-recent-title">
              <h3 id="directory-recent-title">最近写的</h3>
              {recentPosts.length > 0 ? <ol>
                {recentPosts.map((post) => <li key={post.id}>
                  <time dateTime={post.date}>{post.date}</time>
                  <a
                    href={post.href}
                    data-blog-post-entry={`rail-${post.slug}`}
                    onClick={(event) => handlePostClick(event, post)}
                  >{post.title}</a>
                </li>)}
              </ol> : <p>还没有更新。</p>}
            </section>

            <section aria-labelledby="directory-archive-title">
              <h3 id="directory-archive-title">归档</h3>
              {archiveYears.length > 0 ? <ol>
                {archiveYears.map((item) => <li key={item.year}>
                  <a href={`#archive-${item.year}`} onClick={handlePageAnchorClick}>{item.year}</a>
                  <span>{item.count}</span>
                </li>)}
              </ol> : <p>会从第一篇开始。</p>}
            </section>
          </aside>
        </div>

        <footer className="blog-directory__footer">MAPLE / BLOG</footer>
      </section>
    </main>
  );
}

export default BlogPage;
