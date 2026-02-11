import { memo, useMemo } from "react";
import { Copy, Download, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { save } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useAppStore } from "../store/appStore";
import { saveMarkdownFile } from "../lib/commands";
import { parseMarkdownFencesWithMeta } from "../lib/parseFences";
import type { ParsedBlock } from "../lib/parseFences";
import type { DisplayMessage } from "../types";

interface Props {
  message: DisplayMessage;
}

export const MessageBubble = memo(function MessageBubble({ message }: Props) {
  const { t } = useTranslation();
  const outputFolderPath = useAppStore((s) => s.outputFolderPath);
  const isUser = message.role === "user";

  // Extract MD blocks with filenames for download (from original content, before unwrapping)
  const mdBlocks: ParsedBlock[] = useMemo(
    () => (isUser ? [] : parseMarkdownFencesWithMeta(message.content)),
    [message.content, isUser]
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    toast.success(t("messages.copied"));
  };

  const handleCopyMd = async (block: ParsedBlock) => {
    await navigator.clipboard.writeText(block.content);
    toast.success(t("messages.copied"));
  };

  const handleDownloadMd = async (block: ParsedBlock, index: number) => {
    try {
      let defaultName = block.filename;
      if (!defaultName) {
        const firstLine = block.content.split("\n")[0].replace(/^#+\s*/, "").trim();
        defaultName = firstLine
          ? firstLine.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + ".md"
          : `document${mdBlocks.length > 1 ? `-${index + 1}` : ""}.md`;
      }

      const filePath = await save({
        defaultPath: defaultName,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });

      if (filePath) {
        const folder = filePath.substring(0, filePath.lastIndexOf("/"));
        const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
        const savedPath = await saveMarkdownFile(folder, fileName, block.content);
        toast.success(t("messages.fileSaved", { path: savedPath }));
      }
    } catch {
      toast.error(t("messages.fileSaveError"));
    }
  };

  const handleSaveAll = async () => {
    if (!outputFolderPath) {
      toast.error(t("toolbar.noFolderSelected"));
      return;
    }
    try {
      const fileName = `result-${Date.now()}.md`;
      const path = await saveMarkdownFile(
        outputFolderPath,
        fileName,
        message.content
      );
      toast.success(t("messages.fileSaved", { path }));
    } catch {
      toast.error(t("messages.fileSaveError"));
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-800 text-zinc-100 border border-zinc-700"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <>
            <MarkdownRenderer content={message.content} />

            {/* Download bar for extracted MD documents */}
            {mdBlocks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-500/30 space-y-2">
                {mdBlocks.map((block, i) => {
                  const title =
                    block.filename ||
                    block.content.split("\n")[0].replace(/^#+\s*/, "").slice(0, 60) ||
                    `document-${i + 1}.md`;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 rounded-lg border border-blue-500/30"
                    >
                      <Download size={14} className="text-blue-400 shrink-0" />
                      <span className="text-xs text-zinc-300 flex-1 truncate">
                        {title}
                      </span>
                      <button
                        onClick={() => handleCopyMd(block)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 rounded transition-colors"
                        title={t("conversation.copy")}
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => handleDownloadMd(block, i)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
                      >
                        <Download size={12} />
                        {t("conversation.download")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-600">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Copy size={14} />
                {t("conversation.copy")}
              </button>
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Save size={14} />
                {t("conversation.save")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
