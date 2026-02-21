/** @format */

// Lightweight lookup helper for X-style questions (initials → answer).
// Kept separate from the quiz flow so it does not affect test rendering.

import initialsData from "../../extention/questions.json";

type InitialItem = {
  Xquestion?: string;
  question?: string;
  correct_answer?: string;
};

/**
 * Normalize text by removing/replacing special characters, quotes, and prefix labels
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace smart quotes and other quote variants
    .replace(/[''`´]/g, "'")
    .replace(/[""„]/g, '"')
    // Remove prefix labels like "A:", "S:", etc
    .replace(/^[a-z]\s*[:.\-]\s*/g, "")
    // Remove parenthetical content like (a), (1), etc
    .replace(/^[\(\[].*?[\)\]]\s*/g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate string similarity using Levenshtein-like algorithm
 */
function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const edit = levenshteinDistance(longer, shorter);
  return (longer.length - edit) / longer.length;
}

/**
 * Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

const table: Record<string, string> = Object.create(null);
const items = (initialsData as InitialItem[])
  .map((item) => {
    const raw = normalizeText(item.Xquestion ?? item.question ?? "");
    const answer = item.correct_answer?.trim();
    if (!raw || !answer) return null;
    return { Xquestion: raw, correct_answer: answer };
  })
  .filter((i): i is { Xquestion: string; correct_answer: string } => Boolean(i));

items.forEach((item) => {
  if (!table[item.Xquestion]) table[item.Xquestion] = item.correct_answer;
});

/**
 * Lookup a correct answer by its Xquestion initials.
 * The function is pure and does not mutate quiz state.
 */
export function findAnswerByInitials(xq: string): string | null {
  if (!xq) return null;
  const key = normalizeText(xq);
  return table[key] ?? null;
}

/** Substring-friendly lookup with fuzzy matching for typos and variations. */
export function findAnswerByPartialInitials(fragment: string): string | null {
  const key = normalizeText(fragment);
  if (!key) return null;

  const exact = table[key];
  if (exact) return exact;

  // Only find matches if fragment is at least 2 characters
  if (key.length < 2) return null;

  // First try prefix matching
  const prefixHit = items.find((item) => item.Xquestion.startsWith(key));
  if (prefixHit) return prefixHit.correct_answer;

  // Then try fuzzy matching with 75% similarity threshold
  const fuzzyHits = items
    .map((item) => ({
      item,
      similarity: calculateSimilarity(key, item.Xquestion),
    }))
    .filter((hit) => hit.similarity >= 0.75)
    .sort((a, b) => b.similarity - a.similarity);

  return fuzzyHits.length > 0 ? fuzzyHits[0].item.correct_answer : null;
}

/**
 * Utility: build initials from a raw question, stripping leading symbols
 * and keeping only the first alphabetic character of each word.
 */
export function buildInitials(text: string): string {
  if (!text) return "";
  const normalized = normalizeText(text);
  return normalized
    .split(/\s+/)
    .map((part) => {
      const match = part.match(/[a-z]/);
      return match ? match[0] : "";
    })
    .filter(Boolean)
    .join("");
}
