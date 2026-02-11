import { useTranslation } from "react-i18next";
import { FolderOpen } from "lucide-react";
import { useOutputFolder } from "../hooks/useOutputFolder";

export function OutputFolderPicker() {
  const { t } = useTranslation();
  const { outputFolderPath, pickFolder } = useOutputFolder();

  return (
    <button
      onClick={pickFolder}
      className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-300 hover:text-zinc-100 hover:border-zinc-400 transition-colors"
      title={outputFolderPath || t("toolbar.noFolderSelected")}
    >
      <FolderOpen size={14} />
      <span className="max-w-[150px] truncate">
        {outputFolderPath
          ? outputFolderPath.split("/").pop()
          : t("toolbar.outputFolder")}
      </span>
    </button>
  );
}
