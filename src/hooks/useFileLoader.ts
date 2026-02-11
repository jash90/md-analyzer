import { useCallback } from "react";
import { useAppStore } from "../store/appStore";
import { readMarkdownFiles } from "../lib/commands";
import { toast } from "sonner";

export function useFileLoader() {
  const addFiles = useAppStore((s) => s.addFiles);

  const loadFiles = useCallback(
    async (paths: string[]) => {
      try {
        const files = await readMarkdownFiles(paths);
        addFiles(files);
      } catch (err) {
        toast.error(String(err));
        console.error(err);
      }
    },
    [addFiles]
  );

  return { loadFiles };
}
