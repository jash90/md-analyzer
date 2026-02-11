import { invoke, Channel } from "@tauri-apps/api/core";
import type { MarkdownFile, ChatMessage, StreamEvent } from "../types";

export async function readMarkdownFiles(
  paths: string[]
): Promise<MarkdownFile[]> {
  return invoke<MarkdownFile[]>("read_markdown_files", { paths });
}

export async function saveMarkdownFile(
  folderPath: string,
  fileName: string,
  content: string
): Promise<string> {
  return invoke<string>("save_markdown_file", {
    folderPath,
    fileName,
    content,
  });
}

export function streamPerplexityChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number | null,
  onEvent: (event: StreamEvent) => void
): { promise: Promise<void>; channel: Channel<StreamEvent> } {
  const channel = new Channel<StreamEvent>();
  channel.onmessage = onEvent;

  const promise = invoke<void>("stream_perplexity_chat", {
    apiKey,
    model,
    messages,
    temperature,
    onEvent: channel,
  });

  return { promise, channel };
}
