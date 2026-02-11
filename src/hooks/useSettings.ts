import { useEffect } from "react";
import { load } from "@tauri-apps/plugin-store";
import { useAppStore } from "../store/appStore";
import type { AppSettings } from "../types";

const STORE_KEY = "settings";
const STORE_FILE = "settings.json";

export function useSettings() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);

  useEffect(() => {
    (async () => {
      try {
        const store = await load(STORE_FILE);
        const saved = await store.get<AppSettings>(STORE_KEY);
        if (saved) {
          setSettings(saved);
        }
      } catch {
        // First launch, no saved settings
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSettings = async (newSettings: Partial<AppSettings>) => {
    setSettings(newSettings);
    try {
      const merged = { ...settings, ...newSettings };
      const store = await load(STORE_FILE);
      await store.set(STORE_KEY, merged);
      await store.save();
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  return { settings, saveSettings };
}
