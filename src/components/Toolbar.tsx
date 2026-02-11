import { useTranslation } from "react-i18next";
import { Settings, Trash2 } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { OutputFolderPicker } from "./OutputFolderPicker";

export function Toolbar() {
  const { t } = useTranslation();
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const clearMessages = useAppStore((s) => s.clearMessages);

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700">
      <h1 className="text-sm font-bold text-zinc-100 tracking-wide">
        {t("app.title")}
      </h1>

      <div className="flex items-center gap-2">
        <OutputFolderPicker />

        <button
          onClick={clearMessages}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-300 hover:text-red-400 hover:border-red-400/50 transition-colors"
        >
          <Trash2 size={14} />
          {t("toolbar.clearChat")}
        </button>

        <LanguageSwitcher />

        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-300 hover:text-zinc-100 hover:border-zinc-400 transition-colors"
        >
          <Settings size={14} />
          {t("toolbar.settings")}
        </button>
      </div>
    </header>
  );
}
