"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLanguageStore } from "../lib/stores/languageStore";
import { Globe } from "lucide-react";
import { useEffect } from "react";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguageStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Sync language with URL parameter on component mount
  useEffect(() => {
    const urlLang = searchParams.get("l");
    if (urlLang === "ne" || urlLang === "en") {
      setLanguage(urlLang);
    }
  }, [searchParams, setLanguage]);

  const handleLanguageChange = (newLanguage: "en" | "ne") => {
    setLanguage(newLanguage);

    // Update URL with language parameter
    const params = new URLSearchParams(searchParams.toString());
    if (newLanguage === "ne") {
      params.set("l", "ne");
    } else {
      params.delete("l"); // Default to English, no need for 'l=en'
    }

    const newUrl =
      pathname + (params.toString() ? `?${params.toString()}` : "");
    router.push(newUrl);
  };

  return (
    <div className="absolute top-4 right-4 z-50 flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
      <Globe className="h-4 w-4 text-gray-600" />
      <select
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value as "en" | "ne")}
        className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer font-medium"
      >
        <option value="en">EN</option>
        <option value="ne">नेप</option>
      </select>
    </div>
  );
}
