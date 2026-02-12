import { create } from "zustand";
import type {
  MarkdownFile,
  DisplayMessage,
  AppSettings,
  QueuedPrompt,
  ListItem,
} from "../types";

interface AppState {
  files: MarkdownFile[];
  messages: DisplayMessage[];
  settings: AppSettings;
  isStreaming: boolean;
  streamingContent: string;
  outputFolderPath: string;
  includeHistory: boolean;
  settingsOpen: boolean;
  promptQueue: QueuedPrompt[];
  isProcessingQueue: boolean;
  cooldownSeconds: number;
  autoSaveFiles: boolean;
  fileProgress: { current: number; total: number; fileName: string } | null;
  listItems: ListItem[];
  listTemplate: string;
  listProgress: { current: number; total: number; itemContent: string } | null;
  listEditorOpen: boolean;

  addFiles: (files: MarkdownFile[]) => void;
  removeFile: (path: string) => void;
  clearFiles: () => void;
  addMessage: (msg: DisplayMessage) => void;
  clearMessages: () => void;
  setSettings: (s: Partial<AppSettings>) => void;
  setIsStreaming: (v: boolean) => void;
  appendStreamToken: (token: string) => void;
  resetStreamingContent: () => void;
  finalizeAssistantMessage: (content: string, associatedFile?: string, associatedListItem?: string) => void;
  setOutputFolderPath: (path: string) => void;
  setIncludeHistory: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  addToQueue: (command: string, includeHistory: boolean) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  setIsProcessingQueue: (v: boolean) => void;
  setCooldownSeconds: (v: number) => void;
  setAutoSaveFiles: (v: boolean) => void;
  setFileProgress: (v: { current: number; total: number; fileName: string } | null) => void;
  addListItem: (content: string) => void;
  addListItems: (contents: string[]) => void;
  removeListItem: (id: string) => void;
  editListItem: (id: string, content: string) => void;
  clearListItems: () => void;
  reorderListItems: (items: ListItem[]) => void;
  setListTemplate: (v: string) => void;
  setListProgress: (v: { current: number; total: number; itemContent: string } | null) => void;
  setListEditorOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  files: [],
  messages: [],
  settings: {
    apiKey: "",
    model: "sonar",
    language: "pl",
    temperature: 0.7,
    mode: "files",
  },
  isStreaming: false,
  streamingContent: "",
  outputFolderPath: "",
  includeHistory: false,
  settingsOpen: false,
  promptQueue: [],
  isProcessingQueue: false,
  cooldownSeconds: 0,
  autoSaveFiles: false,
  fileProgress: null,
  listItems: [],
  listTemplate: "",
  listProgress: null,
  listEditorOpen: false,

  addFiles: (newFiles) =>
    set((state) => {
      const existingPaths = new Set(state.files.map((f) => f.path));
      const unique = newFiles.filter((f) => !existingPaths.has(f.path));
      return { files: [...state.files, ...unique] };
    }),
  removeFile: (path) =>
    set((state) => ({ files: state.files.filter((f) => f.path !== path) })),
  clearFiles: () => set({ files: [] }),

  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  setSettings: (s) =>
    set((state) => ({ settings: { ...state.settings, ...s } })),
  setIsStreaming: (v) => set({ isStreaming: v }),
  appendStreamToken: (token) =>
    set((state) => ({ streamingContent: state.streamingContent + token })),
  resetStreamingContent: () => set({ streamingContent: "" }),
  finalizeAssistantMessage: (content, associatedFile, associatedListItem) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content,
          timestamp: Date.now(),
          ...(associatedFile && { associatedFile }),
          ...(associatedListItem && { associatedListItem }),
        },
      ],
      streamingContent: "",
      isStreaming: false,
    })),

  setOutputFolderPath: (path) => set({ outputFolderPath: path }),
  setIncludeHistory: (v) => set({ includeHistory: v }),
  setSettingsOpen: (v) => set({ settingsOpen: v }),

  addToQueue: (command, includeHistory) =>
    set((state) => ({
      promptQueue: [
        ...state.promptQueue,
        { id: crypto.randomUUID(), command, includeHistory },
      ],
    })),
  removeFromQueue: (id) =>
    set((state) => ({
      promptQueue: state.promptQueue.filter((p) => p.id !== id),
    })),
  clearQueue: () => set({ promptQueue: [] }),
  setIsProcessingQueue: (v) => set({ isProcessingQueue: v }),
  setCooldownSeconds: (v) => set({ cooldownSeconds: v }),
  setAutoSaveFiles: (v) => set({ autoSaveFiles: v }),
  setFileProgress: (v) => set({ fileProgress: v }),
  addListItem: (content) =>
    set((state) => ({
      listItems: [...state.listItems, { id: crypto.randomUUID(), content }],
    })),
  addListItems: (contents) =>
    set((state) => ({
      listItems: [
        ...state.listItems,
        ...contents.map((c) => ({ id: crypto.randomUUID(), content: c })),
      ],
    })),
  removeListItem: (id) =>
    set((state) => ({
      listItems: state.listItems.filter((item) => item.id !== id),
    })),
  editListItem: (id, content) =>
    set((state) => ({
      listItems: state.listItems.map((item) =>
        item.id === id ? { ...item, content } : item
      ),
    })),
  clearListItems: () => set({ listItems: [] }),
  reorderListItems: (items) => set({ listItems: items }),
  setListTemplate: (v) => set({ listTemplate: v }),
  setListProgress: (v) => set({ listProgress: v }),
  setListEditorOpen: (v) => set({ listEditorOpen: v }),
}));
