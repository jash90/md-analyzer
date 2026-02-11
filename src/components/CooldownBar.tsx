import { Timer } from "lucide-react";
import { useTranslation } from "react-i18next";

const TOTAL_SECONDS = 20;

export function CooldownBar({ seconds }: { seconds: number }) {
  const { t } = useTranslation();
  const progress = ((TOTAL_SECONDS - seconds) / TOTAL_SECONDS) * 100;

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] w-full rounded-xl px-4 py-3 bg-zinc-800 border border-zinc-700">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
          <Timer size={14} className="text-blue-400" />
          <span>{t("queue.cooldown", { seconds })}</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
