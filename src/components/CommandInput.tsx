import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Send, Square, ListOrdered, Plus } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { usePerplexityStream } from "../hooks/usePerplexityStream";
import { PromptQueue } from "./PromptQueue";

export function CommandInput() {
  const { t } = useTranslation();
  const [command, setCommand] = useState("");
  const [showQueue, setShowQueue] = useState(false);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const isProcessingQueue = useAppStore((s) => s.isProcessingQueue);
  const cooldownSeconds = useAppStore((s) => s.cooldownSeconds);
  const includeHistory = useAppStore((s) => s.includeHistory);
  const setIncludeHistory = useAppStore((s) => s.setIncludeHistory);
  const apiKey = useAppStore((s) => s.settings.apiKey);
  const queueLength = useAppStore((s) => s.promptQueue.length);
  const addToQueue = useAppStore((s) => s.addToQueue);
  const { send, stop, processQueue, stopQueue } = usePerplexityStream();

  const busy = isStreaming || isProcessingQueue;

  const handleSend = () => {
    if (!command.trim() || busy) return;
    send(command.trim());
    setCommand("");
  };

  const handleAddToQueue = () => {
    if (!command.trim()) return;
    addToQueue(command.trim(), includeHistory);
    setCommand("");
    if (!showQueue) setShowQueue(true);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    if (isProcessingQueue) {
      stopQueue();
    } else {
      stop();
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("command.placeholder")}
        disabled={busy}
        rows={3}
        className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
      />
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeHistory}
            onChange={(e) => setIncludeHistory(e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-xs text-zinc-400">
            {t("command.includeHistory")}
          </span>
        </label>

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowQueue((v) => !v)}
            className="relative flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded-lg transition-colors"
            title={t("queue.toggle")}
          >
            <ListOrdered size={14} />
            {queueLength > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-blue-500 text-white rounded-full px-1">
                {queueLength}
              </span>
            )}
          </button>

          <button
            onClick={handleAddToQueue}
            disabled={!command.trim() || !apiKey}
            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 text-sm rounded-lg transition-colors"
            title={t("queue.add")}
          >
            <Plus size={14} />
            {t("queue.add")}
          </button>

          {busy ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              <Square size={14} />
              {cooldownSeconds > 0
                ? t("queue.cooldown", { seconds: cooldownSeconds })
                : isProcessingQueue
                  ? t("queue.processing")
                  : t("command.stop")}
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!command.trim() || !apiKey}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
              title={!apiKey ? t("command.noApiKey") : ""}
            >
              <Send size={14} />
              {t("command.analyze")}
            </button>
          )}
        </div>
      </div>

      {showQueue && (
        <PromptQueue
          onStart={processQueue}
          disabled={busy}
        />
      )}
    </div>
  );
}
