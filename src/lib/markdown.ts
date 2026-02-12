import type { ChatMessage, MarkdownFile, DisplayMessage, ListItem } from "../types";

const SYSTEM_PROMPT = `You are an expert Markdown document analyzer and editor. You help users analyze, improve, and fix Markdown documents.

When analyzing documents:
- Point out formatting issues, broken links, inconsistencies
- Suggest improvements for readability and structure
- Fix grammatical and spelling errors when asked

When generating improved documents:
- Preserve the original structure unless asked to change it
- Use proper Markdown formatting
- Maintain consistency in headings, lists, and code blocks

Always respond in the same language as the user's instruction.

When outputting a complete or improved document, wrap it with special delimiters:
- Start with a line: ==== filename.extension ====
- Then the full document content (may include code blocks, any markdown)
- End with a line: ==== koniec ====

Example:
==== readme.md ====
# My Document
Some content with a code block:
\`\`\`js
console.log("hello");
\`\`\`
==== koniec ====

Never use \`\`\`markdown fences to wrap entire output documents. Use the ==== delimiters instead.`;

const TEXT_SYSTEM_PROMPT = `You are a helpful, knowledgeable assistant. Answer questions clearly and concisely. Always respond in the same language as the user's message.`;

const LIST_SYSTEM_PROMPT = `You are a helpful, knowledgeable assistant processing individual items from a list. Each request contains one item to process. Provide a thorough, well-structured response for this specific item.

When outputting a complete document, wrap it with special delimiters:
- Start with a line: ==== filename.extension ====
- Then the full document content
- End with a line: ==== koniec ====

Always respond in the same language as the user's message.`;

export function buildMessages(
  command: string,
  files: MarkdownFile[],
  history: DisplayMessage[],
  includeHistory: boolean,
  mode: 'files' | 'text' | 'list' = 'files',
  _listItem?: ListItem
): ChatMessage[] {
  const systemPrompt = mode === 'list' ? LIST_SYSTEM_PROMPT : mode === 'text' ? TEXT_SYSTEM_PROMPT : SYSTEM_PROMPT;
  const effectiveFiles = (mode === 'text' || mode === 'list') ? [] : files;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  if (includeHistory && history.length > 0) {
    // Ensure proper alternation: user, assistant, user, assistant...
    // Only include complete pairs (user + assistant) to avoid consecutive same-role messages
    const pairs: DisplayMessage[] = [];
    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      const next = history[i + 1];
      if (msg.role === "user" && next?.role === "assistant") {
        pairs.push(msg, next);
        i++; // skip the assistant, already added
      }
    }
    for (const msg of pairs) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  let userContent = command;

  if (effectiveFiles.length > 0) {
    const filesSection = effectiveFiles
      .map(
        (f) =>
          `\n---\n### File: ${f.name}\n\`\`\`markdown\n${f.content}\n\`\`\`\n`
      )
      .join("");

    userContent = `${command}\n\n## Attached Markdown Files:${filesSection}`;
  }

  messages.push({ role: "user", content: userContent });

  return messages;
}
