import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./translations.js";
import { setApiLang } from "../api/client.js";

const LanguageContext = createContext(null);
const STORAGE_KEY = "usar_language";

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "en";
  });

  // Sync the public API client's language *during render* (before any child
  // effect runs) so refetches triggered by a language change send `?lang=`
  // with the already-updated value.
  setApiLang(lang);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => (key) => translations[lang]?.[key] ?? translations.en?.[key] ?? key, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}