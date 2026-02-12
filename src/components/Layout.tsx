import { Toolbar } from "./Toolbar";
import { FileDropZone } from "./FileDropZone";
import { FileList } from "./FileList";
import { CommandInput } from "./CommandInput";
import { ConversationPanel } from "./ConversationPanel";
import { SettingsDialog } from "./SettingsDialog";
import { ListEditorModal } from "./ListEditorModal";
import { useAppStore } from "../store/appStore";

export function Layout() {
  const mode = useAppStore((s) => s.settings.mode);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - files & command */}
        <aside className="w-[370px] flex flex-col border-r border-zinc-700 bg-zinc-900/50">
          {mode === 'files' && (
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <FileDropZone />
              <FileList />
            </div>
          )}
          <div className={`p-4 border-t border-zinc-700 ${mode === 'text' || mode === 'list' ? 'flex-1 flex flex-col justify-end' : ''}`}>
            <CommandInput />
          </div>
        </aside>

        {/* Right panel - conversation */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ConversationPanel />
        </main>
      </div>

      <SettingsDialog />
      <ListEditorModal />
    </div>
  );
}
