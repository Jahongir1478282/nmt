/** @format */

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { tests } from "../lib/tests";
import { buildInitials } from "../lib/xsearch";

const normalizeQuestion = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(
      /^[\s"'`~!@#$%^&*()\[\]{}<>.,;:/?\\|-]+|[\s"'`~!@#$%^&*()\[\]{}<>.,;:/?\\|-]+$/g,
      "",
    )
    .trim();

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAnswer, setSearchAnswer] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<{
    question: string;
    testTitle: string;
  } | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchIndex = useMemo(() => {
    const entries: Array<{
      question: string;
      answer: string;
      testTitle: string;
      normalized: string;
      initials: string;
    }> = [];
    const byNormalized = new Map<string, (typeof entries)[number]>();

    Object.values(tests).forEach((test) => {
      test.questions.forEach((q) => {
        if (!q.question || !q.correct_answer) return;
        const normalized = normalizeQuestion(q.question);
        if (!normalized) return;
        const entry = {
          question: q.question,
          answer: q.correct_answer,
          testTitle: test.title,
          normalized,
          initials: buildInitials(q.question),
        };
        entries.push(entry);
        if (!byNormalized.has(normalized)) byNormalized.set(normalized, entry);
      });
    });

    return { entries, byNormalized };
  }, []);

  const runSearch = useCallback(
    (raw: string): void => {
      const normalized = normalizeQuestion(raw);
      if (!normalized) {
        setSearchAnswer(null);
        setSearchMeta(null);
        return;
      }

      const exact = searchIndex.byNormalized.get(normalized);
      if (exact) {
        setSearchAnswer(exact.answer);
        setSearchMeta({
          question: exact.question,
          testTitle: exact.testTitle,
        });
        return;
      }

      const queryInitials = buildInitials(raw);
      const initialsHit = queryInitials
        ? searchIndex.entries.find((entry) => entry.initials === queryInitials)
        : null;
      if (initialsHit) {
        setSearchAnswer(initialsHit.answer);
        setSearchMeta({
          question: initialsHit.question,
          testTitle: initialsHit.testTitle,
        });
        return;
      }

      const partialHit = searchIndex.entries.find((entry) =>
        entry.normalized.includes(normalized),
      );
      if (partialHit) {
        setSearchAnswer(partialHit.answer);
        setSearchMeta({
          question: partialHit.question,
          testTitle: partialHit.testTitle,
        });
        return;
      }

      setSearchAnswer(null);
      setSearchMeta(null);
    },
    [searchIndex],
  );

  const handleSearchChange = useCallback(
    (value: string): void => {
      setSearchQuery(value);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => runSearch(value), 200);
    },
    [runSearch],
  );

  return (
    <div className="min-h-screen bg-white p-6 font-sans text-gray-800">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Savol qidirish</h1>
            <p className="text-sm text-gray-600">
              Savol matni yoki bosh harflar orqali javob toping.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Asosiy menu
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">
            Savol bo'yicha javob qidirish
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Savol matnini yoki bosh harflarini kiriting"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          {searchQuery.trim().length === 0 && (
            <span className="text-gray-500">Natija shu yerda ko'rinadi</span>
          )}
          {searchQuery.trim().length > 0 && searchAnswer && (
            <div className="space-y-2">
              <div className="text-base font-semibold text-gray-900">
                Javob: {searchAnswer}
              </div>
              {searchMeta && (
                <div className="space-y-1 text-xs text-gray-500">
                  <div>Test: {searchMeta.testTitle}</div>
                  <div>Savol: {searchMeta.question}</div>
                </div>
              )}
            </div>
          )}
          {searchQuery.trim().length > 0 && !searchAnswer && (
            <span className="text-red-500">Topilmadi</span>
          )}
        </div>
      </div>
    </div>
  );
}
