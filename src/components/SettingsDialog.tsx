import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { useSettings } from "../hooks/useSettings";
import { toast } from "sonner";

export function SettingsDialog() {
  const { t, i18n } = useTranslation();
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const { settings, saveSettings } = useSettings();

  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [language, setLanguage] = useState(settings.language);

  useEffect(() => {
    setApiKey(settings.apiKey);
    setModel(settings.model);
    setTemperature(settings.temperature);
    setLanguage(settings.language);
  }, [settings, settingsOpen]);

  if (!settingsOpen) return null;

  const handleSave = async () => {
    await saveSettings({ apiKey, model, temperature, language });
    i18n.changeLanguage(language);
    toast.success(t("messages.settingsSaved"));
    setSettingsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">
            {t("settings.title")}
          </h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              {t("settings.apiKey")}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t("settings.apiKeyPlaceholder")}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              {t("settings.model")}
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="sonar">Sonar</option>
              <option value="sonar-pro">Sonar Pro</option>
              <option value="sonar-reasoning">Sonar Reasoning</option>
              <option value="sonar-reasoning-pro">Sonar Reasoning Pro</option>
              <option value="sonar-deep-research">Sonar Deep Research</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              {t("settings.temperature")}: {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              {t("settings.language")}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="pl">Polski</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {t("settings.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            {t("settings.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
