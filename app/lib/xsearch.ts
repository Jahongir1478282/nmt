/** @format */

// Lightweight lookup helper for X-style questions (initials → answer).
// Kept separate from the quiz flow so it does not affect test rendering.

import initialsData from "../../data/cryptotest_initials.json";

type InitialItem = {
  Xquestion: string;
  correct_answer: string;
};

const table: Record<string, string> = Object.create(null);
const items: InitialItem[] = (initialsData as { questions: InitialItem[] })
  .questions
  .map((item) => ({
    Xquestion: item.Xquestion.trim().toLowerCase(),
    correct_answer: item.correct_answer,
  }))
  .filter((i) => i.Xquestion);

items.forEach((item) => {
  if (!table[item.Xquestion]) table[item.Xquestion] = item.correct_answer;
});

/**
 * Lookup a correct answer by its Xquestion initials.
 * The function is pure and does not mutate quiz state.
 */
export function findAnswerByInitials(xq: string): string | null {
  if (!xq) return null;
  const key = xq.trim().toLowerCase();
  return table[key] ?? null;
}

/** Substring-friendly lookup: returns the first match containing the fragment. */
export function findAnswerByPartialInitials(fragment: string): string | null {
  const key = fragment.trim().toLowerCase();
  if (!key) return null;

  const exact = table[key];
  if (exact) return exact;

  const hit = items.find((item) => item.Xquestion.includes(key));
  return hit ? hit.correct_answer : null;
}

/**
 * Utility: build initials from a raw question, stripping leading symbols
 * and keeping only the first alphabetic character of each word.
 */
export function buildInitials(text: string): string {
  if (!text) return "";
  return text
    .split(/\s+/)
    .map((part) => {
      const match = part.match(/[A-Za-z]/);
      return match ? match[0].toLowerCase() : "";
    })
    .filter(Boolean)
    .join("");
}
