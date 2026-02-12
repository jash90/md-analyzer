export interface MarkdownFile {
  name: string;
  path: string;
  content: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  associatedFile?: string;
  associatedListItem?: string;
}

export type StreamEvent =
  | { type: "Token"; data: string }
  | { type: "Done"; data: string }
  | { type: "Error"; data: string };

export interface QueuedPrompt {
  id: string;
  command: string;
  includeHistory: boolean;
}

export interface ListItem {
  id: string;
  content: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
  language: string;
  temperature: number;
  mode: 'files' | 'text' | 'list';
}
