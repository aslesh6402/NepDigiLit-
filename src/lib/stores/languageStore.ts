import { create } from "zustand";
import { persist } from "zustand/middleware";
import enLocale from "../../locales/en.json";
import neLocale from "../../locales/ne.json";

type Language = "en" | "ne";

const locales = {
  en: enLocale,
  ne: neLocale,
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, translations?: Record<Language, string>) => string;
  initializeFromUrl: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "en",
      setLanguage: (language) => set({ language }),
      t: (key, translations) => {
        const { language } = get();
        if (translations) {
          return translations[language] || translations.en || key;
        }
        // Use locale files directly
        return (
          locales[language][key as keyof (typeof locales)[typeof language]] ||
          locales.en[key as keyof typeof locales.en] ||
          key
        );
      },
      initializeFromUrl: () => {
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const urlLang = urlParams.get("l");
          if (urlLang === "ne" || urlLang === "en") {
            set({ language: urlLang });
          }
        }
      },
    }),
    {
      name: "language-storage",
    }
  )
);
