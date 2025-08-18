"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguageStore } from "@/lib/stores/languageStore";

interface LanguageProviderProps {
  children: React.ReactNode;
}

export default function LanguageProvider({ children }: LanguageProviderProps) {
  const { setLanguage } = useLanguageStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlLang = searchParams.get("l");
    if (urlLang === "ne" || urlLang === "en") {
      setLanguage(urlLang);
    }
  }, [searchParams, setLanguage]);

  return <>{children}</>;
}
