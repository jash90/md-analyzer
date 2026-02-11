/**
 * Parser for ==== filename ==== / ==== koniec ==== delimited blocks.
 * Legacy ```markdown fence helpers are preserved for display/rendering use.
 */

const OPEN_RE = /^====\s+(.+?)\s+====$/;
const CLOSE_RE = /^====\s+koniec\s+====$/i;

interface DelimiterBlock {
  filename: string;
  content: string;
}

function extractDelimiterBlocks(content: string): DelimiterBlock[] {
  const blocks: DelimiterBlock[] = [];
  const lines = content.split("\n");

  let inside = false;
  let filename = "";
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trimEnd();

    if (!inside) {
      const openMatch = OPEN_RE.exec(trimmed);
      if (openMatch && !CLOSE_RE.test(trimmed)) {
        inside = true;
        filename = openMatch[1];
        current = [];
      }
      continue;
    }

    if (CLOSE_RE.test(trimmed)) {
      blocks.push({ filename, content: current.join("\n") });
      inside = false;
      current = [];
    } else {
      current.push(line);
    }
  }

  // Handle unclosed block (partial/streaming response)
  if (inside && current.length > 0) {
    blocks.push({ filename, content: current.join("\n") });
  }

  return blocks;
}

export interface ParsedBlock {
  filename: string;
  content: string;
}

/**
 * Extract document blocks with filename metadata for download.
 * Only returns properly delimited ==== filename ==== / ==== koniec ==== blocks.
 */
export function parseMarkdownFencesWithMeta(content: string): ParsedBlock[] {
  return extractDelimiterBlocks(content)
    .map((b) => ({ filename: b.filename, content: b.content.trim() }))
    .filter((b) => b.content);
}

/**
 * Extract raw content of document blocks for download.
 * Tries ==== delimiters first, falls back to legacy ```markdown fences.
 */
export function parseMarkdownFences(content: string): string[] {
  return parseMarkdownFencesWithMeta(content).map((b) => b.content);
}

/**
 * Rebuild content replacing document wrappers with unwrapped markdown + separators.
 * Tries ==== delimiters first, falls back to legacy ```markdown fences.
 */
export function unwrapMarkdownFences(content: string): string {
  // Try ==== delimiters first
  if (OPEN_RE.test(content)) {
    const lines = content.split("\n");
    const result: string[] = [];
    let inside = false;

    for (const line of lines) {
      const trimmed = line.trimEnd();

      if (!inside) {
        const openMatch = OPEN_RE.exec(trimmed);
        if (openMatch && !CLOSE_RE.test(trimmed)) {
          inside = true;
          result.push("", "---", "");
        } else {
          result.push(line);
        }
        continue;
      }

      if (CLOSE_RE.test(trimmed)) {
        inside = false;
        result.push("", "---", "");
      } else {
        result.push(line);
      }
    }

    return result.join("\n");
  }

  // Fallback: legacy ```markdown fences (simple regex replace)
  return content.replace(
    /```(?:markdown|md)\s*\n([\s\S]*?)```/gi,
    (_match, inner: string) => `\n---\n\n${inner.trim()}\n\n---\n`
  );
}
