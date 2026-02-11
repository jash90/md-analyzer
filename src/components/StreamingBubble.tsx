import { useEffect, useRef, useState } from "react";

/**
 * Lightweight streaming bubble - renders raw text instead of full Markdown
 * during streaming to avoid heavy re-renders on every token.
 * Throttles updates to ~10fps for smooth display without UI freeze.
 */
export function StreamingBubble({ content }: { content: string }) {
  const [displayed, setDisplayed] = useState(content);
  const rafRef = useRef(0);
  const lastUpdate = useRef(0);

  useEffect(() => {
    const now = performance.now();
    // Throttle DOM updates to every ~100ms
    if (now - lastUpdate.current < 100) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplayed(content);
        lastUpdate.current = performance.now();
      });
      return () => cancelAnimationFrame(rafRef.current);
    }
    setDisplayed(content);
    lastUpdate.current = now;
  }, [content]);

  if (!displayed) {
    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-[85%] rounded-xl px-4 py-3 bg-zinc-800 border border-zinc-700">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] rounded-xl px-4 py-3 bg-zinc-800 text-zinc-100 border border-zinc-700">
        <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
          {displayed}
        </pre>
        <span className="inline-block w-2 h-4 bg-zinc-400 animate-pulse ml-0.5" />
      </div>
    </div>
  );
}
