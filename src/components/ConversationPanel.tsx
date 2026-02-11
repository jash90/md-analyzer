import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { MessageBubble } from "./MessageBubble";
import { StreamingBubble } from "./StreamingBubble";
import { CooldownBar } from "./CooldownBar";

function StreamingContent() {
  const streamingContent = useAppStore((s) => s.streamingContent);
  return <StreamingBubble content={streamingContent} />;
}

export function ConversationPanel() {
  const { t } = useTranslation();
  const messages = useAppStore((s) => s.messages);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const cooldownSeconds = useAppStore((s) => s.cooldownSeconds);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll only when user hasn't scrolled up
  useEffect(() => {
    if (!userScrolled) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, isStreaming, cooldownSeconds, userScrolled]);

  // Throttled scroll for streaming content
  useEffect(() => {
    if (!isStreaming || userScrolled) return;
    const id = setInterval(() => {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }, 300);
    return () => clearInterval(id);
  }, [isStreaming, userScrolled]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setUserScrolled(!atBottom);
  };

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <MessageSquare size={48} strokeWidth={1} />
        <p className="text-sm">{t("conversation.empty")}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4"
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {isStreaming && <StreamingContent />}

      {cooldownSeconds > 0 && <CooldownBar seconds={cooldownSeconds} />}

      <div ref={bottomRef} />
    </div>
  );
}
