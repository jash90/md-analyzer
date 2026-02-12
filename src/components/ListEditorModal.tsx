import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, ChevronUp, ChevronDown, Trash2, AlignLeft } from "lucide-react";
import { useAppStore } from "../store/appStore";

export function ListEditorModal() {
  const { t } = useTranslation();
  const listEditorOpen = useAppStore((s) => s.listEditorOpen);
  const setListEditorOpen = useAppStore((s) => s.setListEditorOpen);
  const listItems = useAppStore((s) => s.listItems);
  const addListItem = useAppStore((s) => s.addListItem);
  const removeListItem = useAppStore((s) => s.removeListItem);
  const editListItem = useAppStore((s) => s.editListItem);
  const reorderListItems = useAppStore((s) => s.reorderListItems);

  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [newItem, setNewItem] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bulkMode) {
      setBulkText(listItems.map((i) => i.content).join("\n"));
    }
  }, [bulkMode, listItems]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  if (!listEditorOpen) return null;

  const handleClose = () => {
    setEditingId(null);
    setBulkMode(false);
    setListEditorOpen(false);
  };

  const handleApplyBulk = () => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    reorderListItems(lines.map((content) => ({ id: crypto.randomUUID(), content })));
    setBulkMode(false);
  };

  const handleAddNew = () => {
    if (!newItem.trim()) return;
    addListItem(newItem.trim());
    setNewItem("");
  };

  const handleNewKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddNew();
    }
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditingValue(content);
  };

  const commitEdit = () => {
    if (editingId && editingValue.trim()) {
      editListItem(editingId, editingValue.trim());
    }
    setEditingId(null);
  };

  const handleEditKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= listItems.length) return;
    const next = [...listItems];
    [next[index], next[target]] = [next[target], next[index]];
    reorderListItems(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">
            {t("list.editorTitle")} ({listItems.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBulkMode(!bulkMode)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                bulkMode
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-400"
                  : "border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
              }`}
              title={t("list.bulkEdit")}
            >
              <AlignLeft size={12} />
              {t("list.bulkEdit")}
            </button>
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {bulkMode ? (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <p className="text-xs text-zinc-500">{t("list.bulkEditHint")}</p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="flex-1 min-h-[200px] rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
            />
            <button
              onClick={handleApplyBulk}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              {t("list.apply")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={handleNewKeyDown}
                placeholder={t("command.listItemPlaceholder")}
                className="flex-1 rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddNew}
                disabled={!newItem.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 text-sm rounded-lg transition-colors"
              >
                <Plus size={14} />
                {t("queue.add")}
              </button>
            </div>

            <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-700/50 rounded-lg border border-zinc-700 bg-zinc-800/50">
              {listItems.length === 0 ? (
                <li className="px-3 py-6 text-xs text-zinc-500 text-center">
                  {t("list.empty")}
                </li>
              ) : (
                listItems.map((item, index) => (
                  <li
                    key={item.id}
                    className="group flex items-center gap-2 px-3 py-2 hover:bg-zinc-700/30"
                  >
                    <span className="text-xs text-zinc-500 font-mono w-6 shrink-0 text-right">
                      {index + 1}.
                    </span>

                    {editingId === item.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        onBlur={commitEdit}
                        className="flex-1 rounded bg-zinc-700 border border-blue-500 px-2 py-0.5 text-xs text-zinc-100 focus:outline-none"
                      />
                    ) : (
                      <span
                        className="text-xs text-zinc-300 flex-1 cursor-text truncate"
                        onClick={() => startEdit(item.id, item.content)}
                        title={item.content}
                      >
                        {item.content}
                      </span>
                    )}

                    <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        className="p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                        title={t("list.moveUp")}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => moveItem(index, 1)}
                        disabled={index === listItems.length - 1}
                        className="p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                        title={t("list.moveDown")}
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        onClick={() => removeListItem(item.id)}
                        className="p-0.5 text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg transition-colors"
            >
              {t("list.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
