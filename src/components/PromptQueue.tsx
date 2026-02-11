import { useTranslation } from "react-i18next";
import { Play, Trash2, X, History, HardDriveDownload, FileText } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { toast } from "sonner";

interface PromptQueueProps {
  onStart: () => void;
  disabled: boolean;
}

export function PromptQueue({ onStart, disabled }: PromptQueueProps) {
  const { t } = useTranslation();
  const queue = useAppStore((s) => s.promptQueue);
  const removeFromQueue = useAppStore((s) => s.removeFromQueue);
  const clearQueue = useAppStore((s) => s.clearQueue);
  const autoSaveFiles = useAppStore((s) => s.autoSaveFiles);
  const setAutoSaveFiles = useAppStore((s) => s.setAutoSaveFiles);
  const outputFolderPath = useAppStore((s) => s.outputFolderPath);
  const fileProgress = useAppStore((s) => s.fileProgress);

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden">
      <div className="border-b border-zinc-700 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <span className="w-full text-xs font-medium text-zinc-300">
          {t("queue.title")} ({queue.length})
        </span>
        <button
          type="button"
          onClick={() => {
            if (!outputFolderPath) {
              toast.warning(t("queue.autoSaveNoFolder"));
              return;
            }
            setAutoSaveFiles(!autoSaveFiles);
          }}
          className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded border transition-colors ${
            autoSaveFiles && outputFolderPath
              ? "border-blue-500/50 bg-blue-500/15 text-blue-400"
              : "border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
          }`}
        >
          <HardDriveDownload size={12} />
          {t("queue.autoSave")}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onStart}
            disabled={disabled || queue.length === 0}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            <Play size={12} />
            {t("queue.start")}
          </button>
          <button
            onClick={clearQueue}
            disabled={queue.length === 0}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-600 hover:bg-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            <Trash2 size={12} />
            {t("queue.clear")}
          </button>
        </div>
      </div>

      {fileProgress && (
        <div className="border-b border-zinc-700 px-3 py-1.5 flex items-center gap-2 bg-blue-500/10">
          <FileText size={12} className="text-blue-400" />
          <span className="text-xs text-blue-300">
            {t("queue.fileProgress", { current: fileProgress.current, total: fileProgress.total })}
          </span>
          <span className="text-xs text-zinc-400 truncate">{fileProgress.fileName}</span>
        </div>
      )}

      {queue.length === 0 ? (
        <p className="px-3 py-3 text-xs text-zinc-500 text-center">
          {t("queue.empty")}
        </p>
      ) : (
        <ul className="max-h-48 overflow-y-auto divide-y divide-zinc-700/50">
          {queue.map((item, index) => (
            <li
              key={item.id}
              className="group flex items-center gap-2 px-3 py-2 hover:bg-zinc-700/30"
            >
              <span className="text-xs text-zinc-500 font-mono w-5 shrink-0">
                {index + 1}.
              </span>
              <span className="text-xs text-zinc-300 truncate flex-1">
                {item.command}
              </span>
              {item.includeHistory && (
                <span
                  className="shrink-0 text-blue-400"
                  title={t("queue.includeHistory")}
                >
                  <History size={12} />
                </span>
              )}
              <button
                onClick={() => removeFromQueue(item.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
