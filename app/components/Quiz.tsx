/** @format */

"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Clock, ChevronLeft, ChevronRight, Flag, Shuffle } from "lucide-react";
import type { Question, TestConfig } from "../lib/tests";
import {
  buildInitials,
  findAnswerByInitials,
  findAnswerByPartialInitials,
} from "../lib/xsearch";

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
type FinishStage = "quiz" | "modal" | "results";

const buildQuizKey = (test: TestConfig) =>
  `${test.title ?? "quiz"}-${test.randomCount ?? "all"}-${test.questions.length}`;

export default function Quiz({ test }: { test: TestConfig }) {
  return <QuizContent key={buildQuizKey(test)} test={test} />;
}

function QuizContent({ test }: { test: TestConfig }) {
  const [isReady, setIsReady] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [timeLeft, setTimeLeft] = useState(test.durationSeconds ?? 4800);
  const [isFinished, setIsFinished] = useState(false);
  const [finishReason, setFinishReason] = useState<FinishReason>(null);
  const [finishStage, setFinishStage] = useState<FinishStage>("quiz");
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(5);
  const [showReview, setShowReview] = useState(false);
  const [showOnlyIncorrect, setShowOnlyIncorrect] = useState(false);
  const [xQuery, setXQuery] = useState("");
  const [xAnswer, setXAnswer] = useState<string | null>(null);
  const [xKey, setXKey] = useState("");

  const nextQuestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const xSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const xLastQueryRef = useRef<string>("");
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rafId = requestAnimationFrame(() => setIsReady(true));
    const nextQuestionTimeout = nextQuestionTimeoutRef.current;
    const xSearchTimeout = xSearchTimeoutRef.current;
    return () => {
      cancelAnimationFrame(rafId);
      if (nextQuestionTimeout) clearTimeout(nextQuestionTimeout);
      if (xSearchTimeout) clearTimeout(xSearchTimeout);
    };
  }, []);

  const buildPool = useCallback(
    (shuffle: boolean): Question[] => {
      let base = test.randomCount
        ? shuffleAndTake(test.questions, test.randomCount)
        : [...test.questions];

      if (shuffle) {
        base = base
          .map((item) => ({ item, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ item }) => item);
      }

      return base.map((q) => ({
        ...q,
        options: shuffleOptions(q.options),
      }));
    },
    [test],
  );

  const [questionPool, setQuestionPool] = useState<Question[]>(() =>
    buildPool(false),
  );

  useEffect(() => {
    if (!showReview) setShowOnlyIncorrect(false);
  }, [showReview]);

  const runXSearch = useCallback((raw: string): void => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setXAnswer(null);
      setXKey("");
      return;
    }

    const direct = findAnswerByInitials(trimmed);
    if (direct) {
      setXAnswer(direct);
      setXKey(trimmed.toLowerCase());
      return;
    }

    const built = buildInitials(trimmed);
    const maybe = built ? findAnswerByInitials(built) : null;
    if (maybe) {
      setXAnswer(maybe);
      setXKey(built);
      return;
    }

    const partial =
      findAnswerByPartialInitials(trimmed) ??
      (built ? findAnswerByPartialInitials(built) : null);
    setXAnswer(partial ?? null);
    setXKey(partial ? built || trimmed.toLowerCase() : "");
  }, []);

  const handleXSearch = useCallback(
    (value: string): void => {
      setXQuery(value);
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        xLastQueryRef.current = "";
        if (xSearchTimeoutRef.current)
          clearTimeout(xSearchTimeoutRef.current);
        runXSearch("");
        return;
      }

      if (xSearchTimeoutRef.current)
        clearTimeout(xSearchTimeoutRef.current);
      xLastQueryRef.current = normalized;
      runXSearch(value);
    },
    [runXSearch],
  );

  // Rebuild the pool once client-side hydration is ready (shuffled options)
  useEffect(() => {
    if (isReady) {
      setQuestionPool(buildPool(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const shuffleQuestions = (): void => {
    setQuestionPool(buildPool(true));
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  };

  const totalSlots = questionPool.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleFinish = useCallback((reason: FinishReason): void => {
    setFinishReason((prev) => prev ?? reason);
    setIsFinished((prev) => {
      if (prev) return prev;
      setAutoRedirectSeconds(5);
      setFinishStage((stage) => (stage === "results" ? stage : "modal"));
      if (nextQuestionTimeoutRef.current)
        clearTimeout(nextQuestionTimeoutRef.current);
      return true;
    });
  }, []);
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          queueMicrotask(() => handleFinish("time"));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, handleFinish]);

  useEffect(() => {
    if (finishStage !== "modal") return;
    const countdown = setInterval(() => {
      setAutoRedirectSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setFinishStage("results");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [finishStage]);

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

  const handleOptionSelect = (optionIndex: number): void => {
    if (isFinished) return;
    // Prevent reselection: once a question is answered, block further changes.
    if (selectedAnswers.hasOwnProperty(currentQuestionIndex)) return;

    setSelectedAnswers((prev) => {
      const updated = { ...prev, [currentQuestionIndex]: optionIndex };
      return updated;
    });

    if (answeredCount + 1 === totalSlots) {
      queueMicrotask(() => handleFinish("all-answered"));
    }

    if (nextQuestionTimeoutRef.current)
      clearTimeout(nextQuestionTimeoutRef.current);
    nextQuestionTimeoutRef.current = setTimeout(() => {
      setCurrentQuestionIndex((prev) => Math.min(totalSlots - 1, prev + 1));
    }, 800);
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

  useEffect(() => {
    setXQuery("");
    setXAnswer(null);
    setXKey("");
  }, [currentQuestionIndex]);

  const completionPercent = useMemo(
    () => (totalSlots ? Math.round((correctCount / totalSlots) * 100) : 0),
    [correctCount, totalSlots],
  );

  const xResultText = xAnswer ?? (xKey ? "Topilmadi" : "");
  const xResultClass = xAnswer
    ? "text-gray-700"
    : xKey
      ? "text-red-500"
      : "text-transparent";

  const finishReasonLabel = useMemo(() => {
    switch (finishReason) {
      case "time":
        return "Vaqt tugadi";
      case "manual":
        return "Oldin yakunlandi";
      case "all-answered":
        return "Barcha savollar yakunlandi";
      default:
        return "Natija";
    }
  }, [finishReason]);

  useEffect(() => {
    if (finishStage === "results" && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [finishStage]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 font-sans text-gray-800 sm:px-6">
        <div className="max-w-3xl mx-auto text-sm text-gray-500">
          Yuklanmoqda...
        </div>
      </div>
    );
  }

  if (finishStage === "results") {
    return (
      <div className="min-h-screen bg-white px-4 py-8 font-sans text-gray-800 sm:px-6">
        <div className="max-w-5xl mx-auto rounded-2xl" ref={resultRef}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold leading-tight">Natija</h1>
              <p className="text-sm text-gray-500">{test.title}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-gray-800">
            <div className="text-lg font-semibold">
              To&apos;g&apos;ri javoblar:{" "}
              <span className="text-green-700">{correctCount}</span>
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
            <div className="text-sm text-gray-600">
              Sabab: {finishReasonLabel}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-lg bg-blue-600 p-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Asosiy menyu
            </Link>
            <button
              onClick={() => setShowReview((prev) => !prev)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              {showReview ? "Javoblarni yashirish" : "Javoblarni ko\u2018rish"}
            </button>
            {showReview &&
              (showOnlyIncorrect ? (
                <button
                  onClick={() => setShowOnlyIncorrect((prev) => !prev)}
                  className="rounded-lg border border-orange-500 bg-white px-4 py-2 text-sm font-semibold text-orange-500 shadow-sm hover:bg-gray-50"
                >
                  Barchasini ko‘rish
                </button>
              ) : (
                <button
                  onClick={() => setShowOnlyIncorrect((prev) => !prev)}
                  className="rounded-lg border border-red-500 bg-white px-4 py-2 text-sm font-semibold text-red-500 shadow-sm hover:bg-gray-50"
                >
                  Noto‘g‘ri javoblarni ko‘rish
                </button>
              ))}

            {/* {showReview && (
                <button
                  onClick={() => setShowOnlyIncorrect((prev) => !prev)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  {showOnlyIncorrect
                    ? "Barchasini ko‘rish"
                    : "Noto‘g‘ri javoblarni ko‘rish"}
                </button>
              )} */}
          </div>

          {showReview && (
            <div className="mt-2 space-y-1">
              <h2 className="text-lg font-bold text-gray-900">
                Savollar va javoblar
              </h2>
              {(showOnlyIncorrect
                ? questionPool
                    .map((q, idx) => ({ q, idx }))
                    .filter(({ q, idx }) => {
                      const correctIdx = getCorrectIndex(q);
                      const selectedIdx = selectedAnswers[idx];
                      return (
                        selectedIdx !== undefined &&
                        correctIdx !== null &&
                        selectedIdx !== correctIdx
                      );
                    })
                : questionPool.map((q, idx) => ({ q, idx }))
              ).map(({ q, idx }) => {
                const correctIdx = getCorrectIndex(q);
                const selectedIdx = selectedAnswers[idx];
                const isCorrect =
                  correctIdx !== null && selectedIdx === correctIdx;
                const isAnswered = selectedIdx !== undefined;

                return (
                  <div
                    key={idx}
                    className={`border-b p-3 ${!isAnswered ? "border-gray-200 bg-gray-50" : isCorrect ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <p className="font-semibold text-gray-900 leading-snug">
                        {idx + 1}. {q.question}
                      </p>
                      {!isAnswered && (
                        <span className="hidden sm:flex ml-auto shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          Javob berilmagan
                        </span>
                      )}
                      {isAnswered && isCorrect && (
                        <span className="hidden sm:flex ml-auto shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          To&apos;g&apos;ri ✓
                        </span>
                      )}
                      {isAnswered && !isCorrect && (
                        <span className="hidden sm:flex ml-auto shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Noto&apos;g&apos;ri ✗
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isThisCorrect = correctIdx === optIdx;
                        const isThisSelected = selectedIdx === optIdx;
                        let optStyle =
                          "rounded-lg border px-3 py-2 text-sm transition-all";

                        if (isThisCorrect && isThisSelected) {
                          optStyle +=
                            " bg-green-100 border-green-400 text-green-900 font-semibold";
                        } else if (isThisSelected && !isThisCorrect) {
                          optStyle +=
                            " bg-red-100 border-red-400 text-red-900 font-semibold line-through";
                        } else if (isThisCorrect) {
                          optStyle +=
                            " bg-green-50 border-green-300 text-green-800 font-medium";
                        } else {
                          optStyle += " bg-white border-gray-200 text-gray-600";
                        }

                        return (
                          <div key={optIdx} className={optStyle}>
                            {isThisCorrect && (
                              <span className="mr-1.5 text-green-600">✓</span>
                            )}
                            {isThisSelected && !isThisCorrect && (
                              <span className="mr-1.5 text-red-500">✗</span>
                            )}
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
        </div>
        <Link
          href="/"
          className="shrink-0 text-sm text-blue-600 hover:underline sm:text-base"
        >
          ← Asosiy menu
        </Link>
      </div>

      {finishStage === "modal" && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Test yakunlanmoqda
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {finishReasonLabel}
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Natijalar {autoRedirectSeconds} soniyadan so&apos;ng avtomatik
              ko&apos;rsatiladi.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setFinishStage("results")}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                Natijani hozir ko&apos;rish
              </button>
              <Link
                href="/"
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Bosh sahifa
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="hidden sm:grid grid-cols-[repeat(auto-fit,minmax(44px,1fr))] gap-2 sm:max-h-none overflow-auto  bg-white">
          {Array.from({ length: totalSlots }, (_, i) => i).map((index) => {
            const isCurrent = index === currentQuestionIndex;
            const isAnswered = selectedAnswers.hasOwnProperty(index);
            const baseStyle =
              "min-w-[32px] h-10 flex items-center justify-center text-xs sm:text-sm border rounded cursor-pointer transition-colors";

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
            Savollar:{" "}
            <span className="text-black font-normal">{answeredCount}</span>
            <span className="text-gray-500 font-normal">/{totalSlots}</span>
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-none rounded-full border border-gray-200 bg-white/80 px-3 py-2 shadow-sm ring-1 ring-transparent transition focus-within:border-blue-300 focus-within:ring-blue-200">
              <input
                value={xQuery}
                onChange={(e) => handleXSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-30 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <span
              className={`w-160 text-[11px] sm:text-xs whitespace-normal wrap-break-word pr-1 ${xResultClass}`}
            >
              {xResultText}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex w-18  items-center text-red-500 gap-2 ">
            <Clock color="gray" size={18} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={shuffleQuestions}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            disabled={isFinished}
          >
            <Shuffle size={16} className="text-blue-500" />
            <span className="hidden sm:inline">Aralashtirish</span>
            <span className="sm:hidden">Aralash</span>
          </button>
          <button
            onClick={() => handleFinish("manual")}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            disabled={isFinished}
          >
            <Flag size={16} className="text-orange-500" />
            Yakunlash
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
            <div className="mt-10 rounded-2xl border border-gray-500 bg-gray-50 p-5 shadow-inner">
              <h3 className="text-lg font-bold mb-3">Natija</h3>
              <div className="flex flex-col gap-2 text-gray-700 sm:flex-row sm:items-center sm:gap-6">
                <span>
                  To&apos;g&apos;ri javoblar:{" "}
                  <span className="font-semibold text-green-700">
                    {correctCount}
                  </span>
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
