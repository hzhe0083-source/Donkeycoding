import { marked } from "marked";

// 配置 marked：启用 GFM（表格、删除线等），禁用异步
marked.setOptions({
  gfm: true,
  breaks: true,
  async: false,
});

/**
 * 将 Markdown 文本渲染为安全的 HTML。
 * 用于 AI 消息的富文本展示（表格、加粗、代码块等）。
 */
export function renderMarkdown(text: string): string {
  try {
    return marked.parse(text) as string;
  } catch {
    return escapeHtml(text).replace(/\n/g, "<br>");
  }
}

export function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

export function parseString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

export function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

