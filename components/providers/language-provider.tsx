"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  detectBrowserLanguage,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  translate,
} from "@/lib/i18n";
import type { Language, TranslationKey } from "@/lib/i18n/types";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language, options?: { persist?: boolean }) => Promise<void>;
  t: (key: TranslationKey) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored && isLanguage(stored) ? stored : detectBrowserLanguage();
}

function applyDocumentLanguage(language: Language) {
  document.documentElement.lang = language;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLanguage() {
      const stored = readStoredLanguage();
      setLanguageState(stored);
      applyDocumentLanguage(stored);

      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          const profileLanguage = data.settings?.language;
          if (!cancelled && profileLanguage && isLanguage(profileLanguage)) {
            setLanguageState(profileLanguage);
            applyDocumentLanguage(profileLanguage);
            localStorage.setItem(LANGUAGE_STORAGE_KEY, profileLanguage);
          }
        }
      } catch {
        // Guest or offline — keep stored/browser language
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLanguage();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback(
    async (nextLanguage: Language, options?: { persist?: boolean }) => {
      setLanguageState(nextLanguage);
      applyDocumentLanguage(nextLanguage);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);

      if (options?.persist === false) return;

      try {
        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: nextLanguage }),
        });
      } catch {
        // Ignore when user is not logged in
      }
    },
    []
  );

  const t = useCallback(
    (key: TranslationKey) => translate(language, key),
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, isLoading }),
    [language, setLanguage, t, isLoading]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
