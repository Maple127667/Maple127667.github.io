import { memo, useCallback, useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { useLocale } from "./i18n.jsx";

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

const MARKDOWN_PLUGINS = [remarkGfm, remarkHeadingIndexes];
const IMAGE_DIMENSIONS = {
  "/assets/projects/search-agent-retrieval-staircase.webp": { width: 2076, height: 556 },
  "/assets/projects/search-agent-evaluation-loop.webp": { width: 3168, height: 322 },
};

const MarkdownDocument = memo(function MarkdownDocument({ content, headings, endLabel, onOpenImage }) {
  const { copy } = useLocale();
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
      const dimensions = IMAGE_DIMENSIONS[src];
      return <button className="article-image-button" type="button" onClick={() => onOpenImage({ src, alt })} aria-label={copy.reader.enlargeImageAria(alt)}>
        <img src={src} alt={alt} loading="lazy" decoding="async" width={dimensions?.width} height={dimensions?.height} />
      </button>;
    },
  };

  return <>
    <ReactMarkdown remarkPlugins={MARKDOWN_PLUGINS} components={markdownComponents}>{content}</ReactMarkdown>
    <footer>{endLabel}</footer>
  </>;
});

export default function MarkdownContent({ content, headings, endLabel }) {
  const { copy } = useLocale();
  const [lightboxImage, setLightboxImage] = useState(null);
  const lightboxCloseRef = useRef(null);
  const openLightbox = useCallback((image) => setLightboxImage(image), []);

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

  return <div className="article-reader__prose">
    <MarkdownDocument content={content} headings={headings} endLabel={endLabel} onOpenImage={openLightbox} />
    {lightboxImage && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={copy.reader.imagePreviewAria(lightboxImage.alt)} onMouseDown={(event) => {
      if (event.target === event.currentTarget) setLightboxImage(null);
    }}>
      <div className="image-lightbox__panel">
        <button ref={lightboxCloseRef} className="image-lightbox__close" type="button" onClick={() => setLightboxImage(null)} aria-label={copy.reader.closePreview}><X size={23} aria-hidden="true" /></button>
        <img src={lightboxImage.src} alt={lightboxImage.alt} decoding="async" />
        {lightboxImage.alt && <p>{lightboxImage.alt}</p>}
      </div>
    </div>}
  </div>;
}
