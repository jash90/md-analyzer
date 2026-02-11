import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useFileLoader } from "../hooks/useFileLoader";

export function FileDropZone() {
  const { t } = useTranslation();
  const { loadFiles } = useFileLoader();
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const webview = getCurrentWebview();
    const unlisten = webview.onDragDropEvent((event) => {
      if (event.payload.type === "over") {
        setIsDragOver(true);
      } else if (event.payload.type === "drop") {
        setIsDragOver(false);
        const paths = event.payload.paths.filter((p: string) =>
          p.toLowerCase().endsWith(".md")
        );
        if (paths.length > 0) {
          loadFiles(paths);
        }
      } else if (event.payload.type === "leave") {
        setIsDragOver(false);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [loadFiles]);

  const handleClick = async () => {
    const selected = await open({
      multiple: true,
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      if (paths.length > 0) {
        loadFiles(paths);
      }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
        isDragOver
          ? "border-blue-500 bg-blue-500/10"
          : "border-zinc-600 hover:border-zinc-400"
      }`}
    >
      <Upload size={24} className="mx-auto mb-2 text-zinc-400" />
      <p className="text-xs text-zinc-400">
        {isDragOver ? t("files.dropzoneActive") : t("files.dropzone")}
      </p>
    </div>
  );
}
