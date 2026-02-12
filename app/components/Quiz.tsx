/** @format */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import type { Question, TestConfig } from "../lib/tests";

const shuffleAndTake = <T,>(arr: T[], take: number): T[] =>
  [...arr]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, Math.min(take, arr.length))
    .map(({ item }) => item);

const shuffleOptions = (options: string[]): string[] =>
  [...options]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);

type FinishReason = "time" | "manual" | "all-answered" | null;

export default function Quiz({ test }: { test: TestConfig }) {
  // Start with deterministic data to keep SSR/CSR consistent; shuffle only on client.
  const [questionPool, setQuestionPool] = useState<Question[]>(test.questions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(
    {},
  );
  const [timeLeft, setTimeLeft] = useState(test.durationSeconds ?? 4800);
  const [isFinished, setIsFinished] = useState(false);
  const [finishReason, setFinishReason] = useState<FinishReason>(null);
  const [showResults, setShowResults] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const nextQuestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const base = test.randomCount
      ? shuffleAndTake(test.questions, test.randomCount)
      : test.questions;
    const nextPool = base.map((q) => ({ ...q, options: shuffleOptions(q.options) }));
    setQuestionPool(nextPool);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeLeft(test.durationSeconds ?? 4800);
    setIsFinished(false);
    setFinishReason(null);
    setShowResults(false);
    setIsReady(true);
  }, [test]);

  const totalSlots = questionPool.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = totalSlots > 0 && answeredCount === totalSlots;

  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  useEffect(() => {
    if (timeLeft === 0 && !isFinished) {
      handleFinish("time");
    }
  }, [timeLeft, isFinished]);

  useEffect(() => {
    return () => {
      if (nextQuestionTimeoutRef.current)
        clearTimeout(nextQuestionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (allAnswered && !isFinished) {
      handleFinish("all-answered");
    }
  }, [allAnswered, isFinished]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getCorrectIndex = (q: Question): number | null => {
    if (!q.correct_answer) return null;
    const idx = q.options.findIndex((opt) => opt === q.correct_answer);
    return idx >= 0 ? idx : null;
  };

  const handleFinish = (reason: FinishReason): void => {
    if (isFinished) return;
    setIsFinished(true);
    setFinishReason(reason);
    setShowResults(true);
    if (nextQuestionTimeoutRef.current)
      clearTimeout(nextQuestionTimeoutRef.current);
  };

  const handleOptionSelect = (optionIndex: number): void => {
    if (isFinished) return;
    // Prevent reselection: once a question is answered, block further changes.
    if (selectedAnswers.hasOwnProperty(currentQuestionIndex)) return;

    setSelectedAnswers((prev) => {
      const updated = { ...prev, [currentQuestionIndex]: optionIndex };
      return updated;
    });

    if (nextQuestionTimeoutRef.current)
      clearTimeout(nextQuestionTimeoutRef.current);
    nextQuestionTimeoutRef.current = setTimeout(() => {
      setCurrentQuestionIndex((prev) => Math.min(totalSlots - 1, prev + 1));
    }, 600);
  };

  const correctCount = useMemo(
    () =>
      questionPool.reduce((acc, q, idx) => {
        const correctIdx = getCorrectIndex(q);
        const selected = selectedAnswers[idx];
        if (correctIdx !== null && selected === correctIdx) return acc + 1;
        return acc;
      }, 0),
    [questionPool, selectedAnswers],
  );

  const currentQuestion =
    questionPool && questionPool[currentQuestionIndex]
      ? questionPool[currentQuestionIndex]
      : null;

  const completionPercent = useMemo(
    () => (totalSlots ? Math.round((correctCount / totalSlots) * 100) : 0),
    [correctCount, totalSlots],
  );

  useEffect(() => {
    if (showResults && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [showResults]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 font-sans text-gray-800 sm:px-6">
        <div className="max-w-3xl mx-auto text-sm text-gray-500">Yuklanmoqda...</div>
      </div>
    );
  }

  if (isFinished && showResults) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 font-sans text-gray-800 sm:px-6">
        <div className="max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm" ref={resultRef}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold leading-tight">Natija</h1>
              <p className="text-sm text-gray-500">{test.title}</p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-50"
            >
              Bosh sahifa
            </Link>
          </div>

          <div className="flex flex-col gap-3 text-gray-800">
            <div className="text-lg font-semibold">
              To&apos;g&apos;ri javoblar: <span className="text-green-700">{correctCount}</span>
              <span className="text-gray-600"> / {totalSlots}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              {completionPercent}%
              <span className="h-2 w-32 overflow-hidden rounded-full bg-blue-100">
                <span
                  className="block h-full rounded-full bg-blue-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </span>
            </div>
            <div className="text-sm text-gray-600">Sabab: {
              finishReason === "time"
                ? "Vaqt tugadi"
                : finishReason === "manual"
                  ? "Oldin yakunlandi"
                  : "Barcha savollar yakunlandi"
            }</div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowResults(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
            >
              Savollarni ko&apos;rish
            </button>
            <Link
              href="/"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Asosiy menyu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 font-sans text-gray-800 sm:px-6">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur max-w-7xl mx-auto mb-5 flex items-center justify-between gap-3 py-3 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold leading-tight sm:text-2xl">
            {test.title}
          </h1>
          <p className="text-sm text-gray-500 leading-snug sm:text-base">
            {test.description}
          </p>
        </div>
        <Link
          href="/"
          className="shrink-0 text-sm text-blue-600 hover:underline sm:text-base"
        >
          ← Asosiy menu
        </Link>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(44px,1fr))] gap-2 max-h-32 sm:max-h-none overflow-auto  bg-white">
          {Array.from({ length: totalSlots }, (_, i) => i).map((index) => {
            const isCurrent = index === currentQuestionIndex;
            const isAnswered = selectedAnswers.hasOwnProperty(index);
            const baseStyle =
              "min-w-[32px] h-8 flex items-center justify-center text-xs sm:text-sm border rounded cursor-pointer transition-colors";

            if (isCurrent) {
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`${baseStyle} bg-orange-50 border-orange-400 border-2 text-gray-700 font-bold shadow-sm`}
                >
                  {index + 1}
                </button>
              );
            } else if (isAnswered) {
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`${baseStyle} bg-blue-100 border-blue-200 text-blue-800`}
                >
                  {index + 1}
                </button>
              );
            }
            return (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`${baseStyle} bg-white border-gray-200 text-gray-500 hover:bg-gray-50`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white py-2 text-sm sm:text-base">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <span className="font-semibold text-gray-600">
            Savollar: <span className="text-black font-bold">{answeredCount}</span>
            <span className="text-gray-500">/{totalSlots}</span>
          </span>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
              <span
                className="block h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, (answeredCount / Math.max(1, totalSlots)) * 100)}%` }}
              />
            </span>
            <span className="text-xs font-semibold text-blue-600">
              {Math.round((answeredCount / Math.max(1, totalSlots)) * 100)}%
            </span>
          </div>
        </div>

          <div className="flex items-center gap-3">
          <div className="flex items-center text-red-500 font-bold gap-2 rounded-full bg-red-50 px-3 py-1">
            <Clock size={18} />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <button
            onClick={() => handleFinish("manual")}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            disabled={isFinished}
          >
            <Flag size={16} className="text-orange-500" />
            Vaqtdan oldin yakunlash
          </button>
        </div>
      </div>

      {currentQuestion && (
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-snug">
            {currentQuestionIndex + 1}. {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === idx;
              const correctIdx = getCorrectIndex(currentQuestion);
              const isCorrectSelection = isSelected && correctIdx === idx;
              const isWrongSelection = isSelected && correctIdx !== idx;
              const isRightAnswerRevealed =
                correctIdx !== null &&
                correctIdx === idx &&
                selectedAnswers[currentQuestionIndex] !== undefined;

              let style =
                "relative p-3 rounded-lg border cursor-pointer transition-all flex items-start bg-white border-gray-200 hover:border-gray-300";
              if (isCorrectSelection) {
                style =
                  "relative p-3 rounded-lg border cursor-pointer transition-all flex items-start bg-green-50 border-green-500 shadow-sm";
              } else if (isWrongSelection) {
                style =
                  "relative p-3 rounded-lg border cursor-pointer transition-all flex items-start bg-red-50 border-red-400 shadow-sm";
              } else if (isRightAnswerRevealed) {
                style =
                  "relative p-3 rounded-lg border cursor-pointer transition-all flex items-start bg-green-50/40 border-green-400";
              }


              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={`${style} w-full text-left`}
                >
                  
                  <span
                    className={`text-base ${
                      isCorrectSelection
                        ? "text-green-900 font-semibold"
                        : isWrongSelection
                          ? "text-red-900 font-semibold"
                          : "text-gray-700"
                    }`}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between mt-8">
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 flex items-center gap-2"
            >
              <ChevronLeft size={20} /> Oldingi
            </button>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(totalSlots - 1, prev + 1),
                  )
                }
                disabled={currentQuestionIndex === totalSlots - 1}
                className="w-full px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                Keyingi <ChevronRight size={20} />
              </button>
             
            </div>
          </div>
          {isFinished && (
            <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-inner">
              <h3 className="text-lg font-bold mb-3">Natija</h3>
              <div className="flex flex-col gap-2 text-gray-700 sm:flex-row sm:items-center sm:gap-6">
                <span>
                  To&apos;g&apos;ri javoblar: <span className="font-semibold text-green-700">{correctCount}</span>
                  <span className="text-gray-600"> / {totalSlots}</span>
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                  {completionPercent}%
                  <span className="h-2 w-24 overflow-hidden rounded-full bg-blue-100">
                    <span
                      className="block h-full rounded-full bg-blue-500"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </span>
                </span>
                {finishReason === "time" && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                    Vaqt tugadi
                  </span>
                )}
                {finishReason === "manual" && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Oldin yakunlandi
                  </span>
                )}
                {finishReason === "all-answered" && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Barcha savollar yakunlandi
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
