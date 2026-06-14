import { en } from "@/lib/i18n/dictionaries/en";
import { id } from "@/lib/i18n/dictionaries/id";
import type { Dictionary, Language, TranslationKey } from "@/lib/i18n/types";

const dictionaries: Record<Language, Dictionary> = { en, id };

export function getDictionary(language: Language): Dictionary {
  return dictionaries[language] ?? en;
}

export function translate(language: Language, key: TranslationKey): string {
  return getDictionary(language)[key] ?? en[key] ?? key;
}

export function isLanguage(value: string): value is Language {
  return value === "en" || value === "id";
}

export function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
}

export const LANGUAGE_STORAGE_KEY = "turnix-language";
