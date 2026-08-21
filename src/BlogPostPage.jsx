import { useEffect, useRef, useState } from "react";
import { BLOG_POSTS, FIRST_BLOG_POST } from "./content/blogPosts.js";
import { handlePageAnchorClick } from "./pageAnchorNavigation.js";
import "./blog-post.css";

const BLOG_THEME_KEY = "maple-blog-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";

  try {
    const savedTheme = window.localStorage.getItem(BLOG_THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  } catch {
    // The reader remains usable when storage is unavailable.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function renderText(text) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, lineIndex) => (
        <span key={`${lineIndex}-${line.slice(0, 8)}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function renderParts(parts) {
  return parts.map((part, partIndex) => {
    const segment = typeof part === "string" ? { type: "text", text: part } : part;
    const key = `${partIndex}-${segment.text?.slice(0, 8) || segment.type}`;
    const content = renderText(segment.text || "");

    if (segment.type === "strong") return <strong key={key}>{content}</strong>;
    if (segment.type === "strike") return <s key={key}>{content}</s>;
    return <span key={key}>{content}</span>;
  });
}

function renderParagraph(text, index, variant, parts) {
  const paragraphText = text ?? parts?.map((part) => typeof part === "string" ? part : part.text).join("") ?? "";

  return (
    <p
      key={`${index}-${paragraphText.slice(0, 12)}`}
      className={variant ? `blog-post__paragraph blog-post__paragraph--${variant}` : "blog-post__paragraph"}
    >
      {parts?.length > 0 ? renderParts(parts) : renderText(paragraphText)}
    </p>
  );
}

function renderMediaFigure(image, index, { opening = false } = {}) {
  return (
    <figure
      className={opening ? "blog-post__opening-figure" : "blog-post__gallery-figure"}
      key={`${image.src}-${index}`}
    >
      <a
        href={image.src}
        target="_blank"
        rel="noreferrer"
        aria-label={`查看原图：${image.alt}`}
      >
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading={opening && index === 0 ? "eager" : "lazy"}
          fetchPriority={opening && index === 0 ? "high" : "auto"}
          decoding="async"
        />
      </a>
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
  );
}

function renderInlineFigure(block, key) {
  const image = block.image;
  if (!image) return null;

  const className = block.variant === "compact"
    ? "blog-post__inline-figure blog-post__inline-figure--compact"
    : "blog-post__inline-figure";

  return (
    <figure className={className} key={key}>
      <a
        href={image.src}
        target="_blank"
        rel="noreferrer"
        aria-label={`查看原图：${image.alt}`}
      >
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
        />
      </a>
      {image.caption && <figcaption>{image.caption}</figcaption>}
    </figure>
  );
}

function renderBlock(block, index, prefix = "body") {
  if (typeof block === "string") return renderParagraph(block, index);
  if (!block || typeof block !== "object") return null;

  const key = `${prefix}-${block.id || block.title || block.type || "block"}-${index}`;

  if (block.type === "paragraph") {
    return renderParagraph(block.text, key, block.variant, block.parts);
  }

  if (block.type === "quote") {
    return <blockquote key={key}><p>{renderText(block.text)}</p></blockquote>;
  }

  if (block.type === "image") {
    return renderInlineFigure(block, key);
  }

  if (block.type === "external-link") {
    return (
      <p className="blog-post__external-link" key={key}>
        <a href={block.href} target="_blank" rel="noreferrer">
          <span>{block.label}</span>
          <span aria-hidden="true">↗</span>
        </a>
      </p>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="blog-post__list" key={key}>
        {block.items.map((item, itemIndex) => <li key={`${itemIndex}-${item.slice(0, 12)}`}>{item}</li>)}
      </ul>
    );
  }

  if (block.type === "subsection") {
    return (
      <section className="blog-post__subsection" key={key}>
        <h3>{block.title}</h3>
        {block.blocks?.map((child, childIndex) => renderBlock(child, childIndex, key))}
      </section>
    );
  }

  if (block.type === "section") {
    return (
      <section className="blog-post__section" id={block.id} key={key}>
        <header>
          {block.intro && <p>{block.intro}</p>}
          <h2>{block.title}</h2>
        </header>
        {block.blocks?.map((child, childIndex) => renderBlock(child, childIndex, key))}
      </section>
    );
  }

  if (block.type === "gallery") {
    return (
      <section className="blog-post__section blog-post__gallery-section" id={block.id} key={key}>
        <header><h2>{block.title}</h2></header>
        <div className="blog-post__gallery">
          {block.images.map((image, imageIndex) => renderMediaFigure(image, imageIndex))}
        </div>
      </section>
    );
  }

  return null;
}

export function BlogPostPage({
  post = FIRST_BLOG_POST,
  onBack,
  onOpenPost,
  focusOnMount = false,
}) {
  const [theme, setTheme] = useState(getInitialTheme);
  const headingRef = useRef(null);

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
      document.title = `${post.title} — Maple Blog`;
      document.documentElement.lang = "zh-CN";
      description?.setAttribute("content", post.excerpt || `${post.kind}，写于 ${post.date}。`);
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
  }, [post.date, post.excerpt, post.kind, post.title]);

  useEffect(() => {
    document.documentElement.dataset.blogTheme = theme;
    document.body.dataset.blogTheme = theme;
    return () => {
      delete document.documentElement.dataset.blogTheme;
      delete document.body.dataset.blogTheme;
    };
  }, [theme]);

  useEffect(() => {
    if (!focusOnMount) return undefined;
    const frame = window.requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusOnMount]);

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

  const handlePostClick = (event, recentPost) => {
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
    onOpenPost(recentPost.slug, event.currentTarget);
  };

  if (!post) return null;

  const hasRichContent = Boolean(post.opening || post.body.some((block) => typeof block !== "string"));
  const titleAlreadyContainsDate = post.title.startsWith(post.date);
  const recentPosts = [...BLOG_POSTS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);

  return (
    <main className="blog-post-page" data-theme={theme} lang="zh-CN">
      <header className="blog-post-header">
        <a className="blog-post-header__back" href="/blog" onClick={handleBack}>
          <span aria-hidden="true">←</span> 博客目录
        </a>

        <div className="blog-post-wordmark" aria-label="Maple Blog">
          <span>M <i>/</i></span>
          <span>BLOG</span>
        </div>

        <button
          className="blog-post-theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "切换到暗色模式" : "切换到亮色模式"}
        >
          {theme === "light" ? "暗色" : "亮色"}
        </button>
      </header>

      <article className="blog-post" data-rich={hasRichContent ? "true" : undefined}>
        <header className="blog-post__title-block">
          {!titleAlreadyContainsDate && <p className="blog-post__meta">
            <time dateTime={post.date}>{post.date}</time>
            <span aria-hidden="true">/</span>
            <span>{post.kind}</span>
          </p>}
          <h1 ref={headingRef} tabIndex={-1}>
            {post.titleLines?.length > 0
              ? post.titleLines.map((line, index) => <span key={line} data-title-line={index + 1}>{line}</span>)
              : post.title}
          </h1>
        </header>

        {post.opening && <section className="blog-post__frontmatter" aria-labelledby="blog-post-opening-title">
          <aside className="blog-post__opening-note">
            <p className="blog-post__opening-label" id="blog-post-opening-title">{post.opening.label}</p>
            <p className="blog-post__opening-copy">{post.opening.text}</p>

          </aside>

          <div className="blog-post__opening-media">
            {post.opening.images.map((image, index) => renderMediaFigure(image, index, { opening: true }))}
          </div>
        </section>}

        {post.contents?.length > 0 ? <div className="blog-post__reading-layout">
          <aside className="blog-post__reading-sidebar">
            <nav className="blog-post__contents" aria-label="文章目录">
              <p>目录</p>
              <ol>
                {post.contents.map((item, index) => <li key={item.id}>
                  <a href={`#${item.id}`} onClick={handlePageAnchorClick}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    {item.label}
                  </a>
                </li>)}
              </ol>
            </nav>

            <section className="blog-post__recent" aria-labelledby="blog-post-recent-title">
              <h2 id="blog-post-recent-title">RECENT BLOG</h2>
              {recentPosts.length > 0 ? <ol>
                {recentPosts.map((recentPost) => <li key={recentPost.id}>
                  <time dateTime={recentPost.date}>{recentPost.date}</time>
                  <a
                    href={recentPost.href}
                    onClick={(event) => handlePostClick(event, recentPost)}
                  >{recentPost.title}</a>
                </li>)}
              </ol> : <p>这就是目前最新的一篇。</p>}
            </section>
          </aside>

          <div className="blog-post__body">
            {post.body.map((block, index) => renderBlock(block, index))}
          </div>
        </div> : <div className="blog-post__body">
          {post.body.map((block, index) => renderBlock(block, index))}
        </div>}

        <footer className="blog-post__footer">
          <span aria-hidden="true" />
          <a href="/blog" onClick={handleBack}>回到目录</a>
        </footer>
      </article>
    </main>
  );
}

export default BlogPostPage;
