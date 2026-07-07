/**
 * Anti-fabrikasi linter: checks that rephrased text preserves the original content.
 * Run on server after AI generation or on client during review.
 */

// Extract meaningful words from text (≥3 chars, alphanumeric)
function extractKeyWords(text: string): Set<string> {
  const words = text.toLowerCase().match(/\b[a-z0-9]{3,}\b/g);
  return new Set(words ?? []);
}

// Check if orig and rephrased overlap on key words
export interface LintResult {
  score: number;          // 0-100, how much rephrased matches original
  missing: string[];      // key words in orig that are missing in rephrased
  flagged: boolean;       // score < 50 = likely fabricated content
}

export function lintRephrase(original: string, rephrased: string): LintResult {
  const origWords = extractKeyWords(original);
  const repWords = extractKeyWords(rephrased);

  if (origWords.size === 0) return { score: 100, missing: [], flagged: false };

  const missing: string[] = [];
  for (const word of origWords) {
    if (!repWords.has(word)) missing.push(word);
  }

  const overlap = Math.round(((origWords.size - missing.length) / origWords.size) * 100);
  return {
    score: overlap,
    missing: missing.slice(0, 10), // top 10 missing words
    flagged: overlap < 50,
  };
}

export function lintAchievements(
  source: string[],
  rephrased: string[],
): { results: { source: string; rephrased: string; result: LintResult }[]; flagged: number } {
  const results = source.map((s, i) => ({
    source: s,
    rephrased: rephrased[i] ?? "",
    result: lintRephrase(s, rephrased[i] ?? ""),
  }));
  return {
    results,
    flagged: results.filter((r) => r.result.flagged).length,
  };
}
