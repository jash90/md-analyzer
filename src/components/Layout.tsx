import { Toolbar } from "./Toolbar";
import { FileDropZone } from "./FileDropZone";
import { FileList } from "./FileList";
import { CommandInput } from "./CommandInput";
import { ConversationPanel } from "./ConversationPanel";
import { SettingsDialog } from "./SettingsDialog";

export function Layout() {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - files & command */}
        <aside className="w-80 flex flex-col border-r border-zinc-700 bg-zinc-900/50">
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            <FileDropZone />
            <FileList />
          </div>
          <div className="p-4 border-t border-zinc-700">
            <CommandInput />
          </div>
        </aside>

        {/* Right panel - conversation */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ConversationPanel />
        </main>
      </div>

      <SettingsDialog />
    </div>
  );
}
