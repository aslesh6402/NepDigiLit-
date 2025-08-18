"use client";

import { useLanguageStore } from "../lib/stores/languageStore";

interface BilingualTextProps {
  text: {
    en: string;
    ne: string;
  };
  className?: string;
}

export default function BilingualText({
  text,
  className = "",
}: BilingualTextProps) {
  const { language } = useLanguageStore();

  return <span className={className}>{text[language] || text.en}</span>;
}
