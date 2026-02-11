import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/useSettings";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { saveSettings } = useSettings();

  const toggleLanguage = () => {
    const newLang = i18n.language === "pl" ? "en" : "pl";
    i18n.changeLanguage(newLang);
    saveSettings({ language: newLang });
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-2 py-1 text-xs font-medium rounded bg-zinc-800 border border-zinc-600 text-zinc-300 hover:text-zinc-100 hover:border-zinc-400 transition-colors uppercase"
    >
      {i18n.language === "pl" ? "EN" : "PL"}
    </button>
  );
}
