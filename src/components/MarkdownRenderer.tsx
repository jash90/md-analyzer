import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { unwrapMarkdownFences } from "../lib/parseFences";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-white/10 transition-colors"
    >
      {copied ? (
        <Check size={12} className="text-green-400" />
      ) : (
        <Copy size={12} />
      )}
      {copied ? "OK" : "Copy"}
    </button>
  );
}


interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  const processedContent = unwrapMarkdownFences(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-sm dark:prose-invert max-w-none"
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");

          if (match) {
            return (
              <div className="rounded-lg overflow-hidden my-3 border border-zinc-700">
                <div className="flex items-center justify-between px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400">
                  <span className="font-medium">{match[1]}</span>
                  <CopyButton text={codeString} />
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    border: "none",
                  }}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          }

          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
