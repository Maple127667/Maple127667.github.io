import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { uiCopy } from "./content/ui-copy.js";

export const DEFAULT_LOCALE = "zh";
export const LOCALE_STORAGE_KEY = "maple-locale";

function detectInitialLocale() {
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch {
    // Storage can be unavailable (private mode); fall through to detection.
  }
  const language = typeof navigator !== "undefined" ? navigator.language : "";
  return /^en([-_]|$)/i.test(language || "") ? "en" : DEFAULT_LOCALE;
}

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(detectInitialLocale);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute("content", uiCopy[locale].meta.description);
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    copy: uiCopy[locale],
    setLocale: (nextLocale) => {
      if (nextLocale !== "zh" && nextLocale !== "en") return;
      setLocaleState(nextLocale);
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      } catch {
        // The switch still works for this session when storage is unavailable.
      }
    },
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
