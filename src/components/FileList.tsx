import { useTranslation } from "react-i18next";
import { FileText, X, Trash2 } from "lucide-react";
import { useAppStore } from "../store/appStore";

export function FileList() {
  const { t } = useTranslation();
  const files = useAppStore((s) => s.files);
  const removeFile = useAppStore((s) => s.removeFile);
  const clearFiles = useAppStore((s) => s.clearFiles);

  if (files.length === 0) {
    return (
      <p className="text-xs text-zinc-500 py-2">{t("files.empty")}</p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {t("files.title")} ({files.length})
        </h3>
        <button
          onClick={clearFiles}
          className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 size={12} />
          {t("files.clear")}
        </button>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.path}
            className="flex items-center gap-2 px-2 py-1.5 rounded bg-zinc-800 group"
          >
            <FileText size={14} className="text-blue-400 shrink-0" />
            <span className="text-xs text-zinc-300 truncate flex-1">
              {file.name}
            </span>
            <button
              onClick={() => removeFile(file.path)}
              className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
