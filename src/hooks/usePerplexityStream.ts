import { useCallback, useRef, useEffect } from "react";
import { useAppStore } from "../store/appStore";
import { streamPerplexityChat, saveMarkdownFile } from "../lib/commands";
import { buildMessages } from "../lib/markdown";
import { parseMarkdownFencesWithMeta } from "../lib/parseFences";
import type { StreamEvent, MarkdownFile, DisplayMessage } from "../types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const API_DELAY_MS = 20_000;

export function usePerplexityStream() {
  const { t } = useTranslation();
  const abortRef = useRef(false);
  const queueAbortRef = useRef(false);
  const tokenBufferRef = useRef("");
  const flushRef = useRef(0);

  useEffect(() => {
    return () => {
      if (flushRef.current) {
        cancelAnimationFrame(flushRef.current);
      }
    };
  }, []);

  const cooldownWithCountdown = useCallback((abortSignal: { current: boolean }) => {
    return new Promise<void>((resolve) => {
      const store = useAppStore.getState();
      let remaining = Math.ceil(API_DELAY_MS / 1000);
      store.setCooldownSeconds(remaining);

      const interval = setInterval(() => {
        if (abortSignal.current) {
          clearInterval(interval);
          useAppStore.getState().setCooldownSeconds(0);
          resolve();
          return;
        }
        remaining -= 1;
        useAppStore.getState().setCooldownSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  }, []);

  const executeSinglePrompt = useCallback(
    async (command: string, includeHistory: boolean, filesOverride?: MarkdownFile[], messagesOverride?: DisplayMessage[]): Promise<string | null> => {
      const store = useAppStore.getState();
      const { settings, files, messages } = store;

      if (!settings.apiKey) {
        toast.error(t("command.noApiKey"));
        return null;
      }

      const associatedFile = filesOverride?.length === 1 ? filesOverride[0].path : undefined;

      store.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: command,
        timestamp: Date.now(),
        ...(associatedFile && { associatedFile }),
      });

      store.setIsStreaming(true);
      store.resetStreamingContent();
      abortRef.current = false;

      const filesToUse = filesOverride ?? files;
      const historyMessages = messagesOverride ?? messages;
      const chatMessages = buildMessages(
        command,
        filesToUse,
        historyMessages,
        includeHistory
      );

      const totalChars = chatMessages.reduce((sum, m) => sum + m.content.length, 0);
      console.log("[PerplexityStream] Prompt debug:", {
        totalChars,
        estimatedTokens: Math.ceil(totalChars / 4),
        messagesCount: chatMessages.length,
        historyPairs: historyMessages.length,
        files: filesToUse.map((f) => ({ name: f.name, chars: f.content.length })),
        messages: chatMessages.map((m) => ({ role: m.role, chars: m.content.length, preview: m.content.slice(0, 200) })),
      });

      try {
        const content = await new Promise<string | null>((resolve) => {
          const { promise } = streamPerplexityChat(
            settings.apiKey,
            settings.model,
            chatMessages,
            settings.temperature,
            (event: StreamEvent) => {
              if (abortRef.current) return;

              switch (event.type) {
                case "Token":
                  tokenBufferRef.current += event.data;
                  if (!flushRef.current) {
                    flushRef.current = requestAnimationFrame(() => {
                      const buffered = tokenBufferRef.current;
                      tokenBufferRef.current = "";
                      flushRef.current = 0;
                      if (buffered) {
                        useAppStore.getState().appendStreamToken(buffered);
                      }
                    });
                  }
                  break;
                case "Done":
                  if (flushRef.current) {
                    cancelAnimationFrame(flushRef.current);
                    flushRef.current = 0;
                  }
                  if (tokenBufferRef.current) {
                    useAppStore.getState().appendStreamToken(tokenBufferRef.current);
                    tokenBufferRef.current = "";
                  }
                  useAppStore.getState().finalizeAssistantMessage(event.data, associatedFile);
                  resolve(event.data);
                  break;
                case "Error":
                  if (flushRef.current) {
                    cancelAnimationFrame(flushRef.current);
                    flushRef.current = 0;
                  }
                  tokenBufferRef.current = "";
                  useAppStore.getState().setIsStreaming(false);
                  toast.error(event.data);
                  resolve(null);
                  break;
              }
            }
          );

          promise.catch(() => resolve(null));
        });

        return content;
      } catch (err) {
        useAppStore.getState().setIsStreaming(false);
        toast.error(t("messages.streamError"));
        console.error(err);
        return null;
      }
    },
    [t]
  );

  const autoSaveContent = useCallback(async (content: string) => {
    const { autoSaveFiles, outputFolderPath } = useAppStore.getState();
    if (!autoSaveFiles || !outputFolderPath) return;

    const blocks = parseMarkdownFencesWithMeta(content);

    for (const block of blocks) {
      const fileName = block.filename || `document-${Date.now()}.md`;
      try {
        const path = await saveMarkdownFile(outputFolderPath, fileName, block.content);
        toast.success(t("messages.fileSaved", { path }));
      } catch {
        toast.error(t("messages.fileSaveError"));
      }
    }
  }, [t]);

  const send = useCallback(
    async (command: string) => {
      const store = useAppStore.getState();
      const { files, includeHistory } = store;

      if (files.length <= 1) {
        const content = await executeSinglePrompt(command, includeHistory);
        if (content) await autoSaveContent(content);
        return;
      }

      // 2+ files — auto-queue: process each file separately
      store.setIsProcessingQueue(true);
      queueAbortRef.current = false;

      for (let i = 0; i < files.length; i++) {
        if (queueAbortRef.current) break;
        useAppStore.getState().setFileProgress({
          current: i + 1,
          total: files.length,
          fileName: files[i].name,
        });
        if (i > 0) await cooldownWithCountdown(queueAbortRef);
        if (queueAbortRef.current) break;
        const fileMessages = useAppStore.getState().messages.filter(
          (m) => m.associatedFile === files[i].path
        );
        const content = await executeSinglePrompt(command, includeHistory, [files[i]], fileMessages);
        if (content) await autoSaveContent(content);
        if (queueAbortRef.current) break;
      }

      useAppStore.getState().setFileProgress(null);
      useAppStore.getState().setIsProcessingQueue(false);
    },
    [executeSinglePrompt, autoSaveContent]
  );

  const stop = useCallback(() => {
    abortRef.current = true;
    const state = useAppStore.getState();
    if (state.streamingContent) {
      state.finalizeAssistantMessage(state.streamingContent);
    } else {
      state.setIsStreaming(false);
    }
  }, []);

  const processQueue = useCallback(async () => {
    const store = useAppStore.getState();
    if (store.isProcessingQueue || store.promptQueue.length === 0) return;

    store.setIsProcessingQueue(true);
    queueAbortRef.current = false;

    // Snapshot kolejki — oryginał zostaje w store (użytkownik czyści ręcznie)
    const prompts = [...store.promptQueue];

    const { files } = store;

    console.log("[processQueue] START", {
      promptsCount: prompts.length,
      filesCount: files.length,
      prompts: prompts.map((p, idx) => ({ idx, command: p.command.slice(0, 80), includeHistory: p.includeHistory })),
      files: files.map((f, idx) => ({ idx, name: f.name, path: f.path })),
    });

    let iteration = 0;

    try {
      if (files.length <= 1) {
        // 0-1 plików — prosty tryb: prompt po prompcie
        let first = true;
        for (const prompt of prompts) {
          iteration++;
          console.log(`[processQueue] iteration=${iteration}, prompt="${prompt.command.slice(0, 60)}", aborted=${queueAbortRef.current}`);
          if (queueAbortRef.current) break;
          if (!first) {
            console.log(`[processQueue] iteration=${iteration} — cooldown start`);
            await cooldownWithCountdown(queueAbortRef);
            console.log(`[processQueue] iteration=${iteration} — cooldown end, aborted=${queueAbortRef.current}`);
          }
          if (queueAbortRef.current) break;
          first = false;
          console.log(`[processQueue] iteration=${iteration} — executeSinglePrompt START`);
          const content = await executeSinglePrompt(prompt.command, prompt.includeHistory);
          console.log(`[processQueue] iteration=${iteration} — executeSinglePrompt END, hasContent=${!!content}, contentLength=${content?.length ?? 0}`);
          if (content) {
            await autoSaveContent(content);
            console.log(`[processQueue] iteration=${iteration} — autoSave done`);
          }
        }
      } else {
        // 2+ plików — plik po pliku: wszystkie prompty dla jednego pliku, potem następny
        let first = true;
        for (let i = 0; i < files.length; i++) {
          useAppStore.getState().setFileProgress({
            current: i + 1,
            total: files.length,
            fileName: files[i].name,
          });
          for (let j = 0; j < prompts.length; j++) {
            iteration++;
            console.log(`[processQueue] iteration=${iteration}, file[${i}]="${files[i]?.name}", prompt[${j}]="${prompts[j]?.command.slice(0, 60)}", aborted=${queueAbortRef.current}`);
            if (queueAbortRef.current) break;
            if (!first) {
              console.log(`[processQueue] iteration=${iteration} — cooldown start`);
              await cooldownWithCountdown(queueAbortRef);
              console.log(`[processQueue] iteration=${iteration} — cooldown end, aborted=${queueAbortRef.current}`);
            }
            if (queueAbortRef.current) break;
            first = false;

            const fileMessages = useAppStore.getState().messages.filter(
              (m) => m.associatedFile === files[i].path
            );
            console.log(`[processQueue] iteration=${iteration} — executeSinglePrompt START, fileMessages=${fileMessages.length}`);
            const content = await executeSinglePrompt(
              prompts[j].command, prompts[j].includeHistory, [files[i]], fileMessages
            );
            console.log(`[processQueue] iteration=${iteration} — executeSinglePrompt END, hasContent=${!!content}, contentLength=${content?.length ?? 0}`);
            if (content) {
              await autoSaveContent(content);
              console.log(`[processQueue] iteration=${iteration} — autoSave done`);
            }
          }
          if (queueAbortRef.current) break;
        }
      }
    } catch (err) {
      console.error(`[processQueue] CRASH at iteration=${iteration}`, {
        error: err,
        filesCount: files.length,
        promptsCount: prompts.length,
        aborted: queueAbortRef.current,
        storeState: {
          isStreaming: useAppStore.getState().isStreaming,
          isProcessingQueue: useAppStore.getState().isProcessingQueue,
          messagesCount: useAppStore.getState().messages.length,
        },
      });
    }

    console.log(`[processQueue] END, totalIterations=${iteration}, aborted=${queueAbortRef.current}`);
    useAppStore.getState().setFileProgress(null);
    useAppStore.getState().setIsProcessingQueue(false);
  }, [executeSinglePrompt, autoSaveContent, cooldownWithCountdown]);

  const stopQueue = useCallback(() => {
    queueAbortRef.current = true;
    abortRef.current = true;
    const state = useAppStore.getState();
    if (state.streamingContent) {
      state.finalizeAssistantMessage(state.streamingContent);
    } else {
      state.setIsStreaming(false);
    }
    state.setFileProgress(null);
    state.setIsProcessingQueue(false);
  }, []);

  return { send, stop, processQueue, stopQueue };
}
