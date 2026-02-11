import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../store/appStore";

export function useOutputFolder() {
  const outputFolderPath = useAppStore((s) => s.outputFolderPath);
  const setOutputFolderPath = useAppStore((s) => s.setOutputFolderPath);

  const pickFolder = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select output folder",
    });
    if (selected && typeof selected === "string") {
      setOutputFolderPath(selected);
    }
  }, [setOutputFolderPath]);

  return { outputFolderPath, pickFolder };
}
