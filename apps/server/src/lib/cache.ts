export const tailorCache = new Map<string, { status: "pending" | "running" | "done"; jobDescription?: string; userId?: string; result?: unknown; error?: string }>();
export const parseCache = new Map<string, { status: "running" | "done"; result?: unknown; error?: string }>();

export function simpleHash(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}
