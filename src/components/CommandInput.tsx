import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Send, Square, ListOrdered, Plus, X, Trash2, HardDriveDownload, FileUp, Pencil } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../store/appStore";
import { usePerplexityStream } from "../hooks/usePerplexityStream";
import { readMarkdownFiles } from "../lib/commands";
import { PromptQueue } from "./PromptQueue";
import { toast } from "sonner";

export function CommandInput() {
  const { t } = useTranslation();
  const [command, setCommand] = useState("");
  const [listItemInput, setListItemInput] = useState("");
  const [showQueue, setShowQueue] = useState(false);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const isProcessingQueue = useAppStore((s) => s.isProcessingQueue);
  const cooldownSeconds = useAppStore((s) => s.cooldownSeconds);
  const includeHistory = useAppStore((s) => s.includeHistory);
  const setIncludeHistory = useAppStore((s) => s.setIncludeHistory);
  const apiKey = useAppStore((s) => s.settings.apiKey);
  const queueLength = useAppStore((s) => s.promptQueue.length);
  const addToQueue = useAppStore((s) => s.addToQueue);
  const mode = useAppStore((s) => s.settings.mode);
  const setSettings = useAppStore((s) => s.setSettings);

  const listItems = useAppStore((s) => s.listItems);
  const listTemplate = useAppStore((s) => s.listTemplate);
  const setListTemplate = useAppStore((s) => s.setListTemplate);
  const addListItem = useAppStore((s) => s.addListItem);
  const addListItems = useAppStore((s) => s.addListItems);
  const removeListItem = useAppStore((s) => s.removeListItem);
  const clearListItems = useAppStore((s) => s.clearListItems);
  const autoSaveFiles = useAppStore((s) => s.autoSaveFiles);
  const setAutoSaveFiles = useAppStore((s) => s.setAutoSaveFiles);
  const outputFolderPath = useAppStore((s) => s.outputFolderPath);
  const setListEditorOpen = useAppStore((s) => s.setListEditorOpen);

  const { send, stop, processQueue, stopQueue, processListItems } = usePerplexityStream();

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

  const handleAddListItem = () => {
    if (!listItemInput.trim()) return;
    addListItem(listItemInput.trim());
    setListItemInput("");
  };

  const handleListItemKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddListItem();
    }
  };

  const handleImportFromFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Tekst", extensions: ["txt", "md"] }],
      });
      if (!selected) return;
      const files = await readMarkdownFiles([selected]);
      if (!files.length || !files[0].content.trim()) {
        toast.info(t("list.importEmpty"));
        return;
      }
      const lines = files[0].content
        .split("\n")
        .map((line) => line.trim())
        .map((line) => line.replace(/^(?:[-*]\s+|\d+\.\s+)/, ""))
        .filter((line) => line.length > 0);
      if (lines.length === 0) {
        toast.info(t("list.importEmpty"));
        return;
      }
      addListItems(lines);
      toast.success(t("list.imported", { count: lines.length }));
    } catch (err) {
      console.error("Import failed:", err);
      toast.error(t("messages.streamError"));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex rounded-lg bg-zinc-800 border border-zinc-600 overflow-hidden">
        <button
          onClick={() => setSettings({ mode: 'files' })}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'files'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t("command.modeFiles")}
        </button>
        <button
          onClick={() => setSettings({ mode: 'text' })}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'text'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t("command.modeText")}
        </button>
        <button
          onClick={() => setSettings({ mode: 'list' })}
          className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'list'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t("command.modeList")}
        </button>
      </div>

      {mode === 'list' ? (
        <>
          <textarea
            value={listTemplate}
            onChange={(e) => setListTemplate(e.target.value)}
            placeholder={t("command.templatePlaceholder")}
            disabled={busy}
            rows={2}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
          />

          <div className="flex gap-2">
            <input
              type="text"
              value={listItemInput}
              onChange={(e) => setListItemInput(e.target.value)}
              onKeyDown={handleListItemKeyDown}
              placeholder={t("command.listItemPlaceholder")}
              disabled={busy}
              className="flex-1 rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleAddListItem}
              disabled={!listItemInput.trim() || busy}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 text-sm rounded-lg transition-colors"
            >
              <Plus size={14} />
              {t("queue.add")}
            </button>
          </div>

          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden">
            <div className="border-b border-zinc-700 px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">
                {t("list.title")} ({listItems.length})
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
                {t("list.autoSave")}
              </button>
            </div>

            {listItems.length === 0 ? (
              <p className="px-3 py-3 text-xs text-zinc-500 text-center">
                {t("list.empty")}
              </p>
            ) : (
              <ul className="max-h-48 overflow-y-auto divide-y divide-zinc-700/50">
                {listItems.map((item, index) => (
                  <li
                    key={item.id}
                    className="group flex items-center gap-2 px-3 py-2 hover:bg-zinc-700/30"
                  >
                    <span className="text-xs text-zinc-500 font-mono w-5 shrink-0">
                      {index + 1}.
                    </span>
                    <span className="text-xs text-zinc-300 truncate flex-1">
                      {item.content}
                    </span>
                    <button
                      onClick={() => removeListItem(item.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={clearListItems}
                disabled={listItems.length === 0 || busy}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 text-sm rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                {t("list.clear")}
              </button>
              <button
                onClick={handleImportFromFile}
                disabled={busy}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 text-sm rounded-lg transition-colors"
              >
                <FileUp size={14} />
                {t("list.import")}
              </button>
              <button
                onClick={() => setListEditorOpen(true)}
                disabled={busy}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 text-sm rounded-lg transition-colors"
              >
                <Pencil size={14} />
                {t("list.editor")}
              </button>
            </div>

            {busy ? (
              <button
                onClick={handleStop}
                className="w-full flex items-center justify-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
              >
                <Square size={14} />
                {cooldownSeconds > 0
                  ? t("queue.cooldown", { seconds: cooldownSeconds })
                  : isProcessingQueue
                    ? t("queue.processing")
                    : t("command.stop")}
              </button>
            ) : (
              <div title={!apiKey ? t("command.noApiKey") : undefined}>
                <button
                  onClick={processListItems}
                  disabled={listItems.length === 0 || !apiKey}
                  className="w-full flex items-center justify-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  <Send size={14} />
                  {t("command.generate")}
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'text' ? t("command.placeholderText") : t("command.placeholder")}
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

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
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
              </div>

              {busy ? (
                <button
                  onClick={handleStop}
                  className="w-full flex items-center justify-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Square size={14} />
                  {cooldownSeconds > 0
                    ? t("queue.cooldown", { seconds: cooldownSeconds })
                    : isProcessingQueue
                      ? t("queue.processing")
                      : t("command.stop")}
                </button>
              ) : (
                <div title={!apiKey ? t("command.noApiKey") : undefined}>
                  <button
                    onClick={handleSend}
                    disabled={!command.trim() || !apiKey}
                    className="w-full flex items-center justify-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                  >
                    <Send size={14} />
                    {mode === 'text' ? t("command.send") : t("command.analyze")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {showQueue && (
            <PromptQueue
              onStart={processQueue}
              disabled={busy}
            />
          )}
        </>
      )}
    </div>
  );
}
