/** @format */

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { Question, TestConfig } from "../lib/tests";

const shuffleAndTake = <T,>(arr: T[], take: number): T[] =>
  [...arr]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, Math.min(take, arr.length))
    .map(({ item }) => item);

export default function Quiz({ test }: { test: TestConfig }) {
  const questionPool = useMemo(
    () =>
      test.randomCount
        ? shuffleAndTake(test.questions, test.randomCount)
        : test.questions,
    [test],
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [timeLeft, setTimeLeft] = useState(3000);
  const nextQuestionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const totalSlots = questionPool.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isFinished = totalSlots > 0 && answeredCount === totalSlots;

  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft((p) => (p > 0 ? p - 1 : 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (nextQuestionTimeoutRef.current)
        clearTimeout(nextQuestionTimeoutRef.current);
    };
  }, []);

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
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));

    if (nextQuestionTimeoutRef.current)
      clearTimeout(nextQuestionTimeoutRef.current);
    nextQuestionTimeoutRef.current = setTimeout(() => {
      setCurrentQuestionIndex((prev) => Math.min(totalSlots - 1, prev + 1));
    }, 1000);
  };

  const correctCount = questionPool.reduce((acc, q, idx) => {
    const correctIdx = getCorrectIndex(q);
    const selected = selectedAnswers[idx];
    if (correctIdx !== null && selected === correctIdx) return acc + 1;
    return acc;
  }, 0);

  const currentQuestion =
    questionPool && questionPool[currentQuestionIndex]
      ? questionPool[currentQuestionIndex]
      : null;

  return (
    <div className="min-h-screen bg-white p-4 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{test.title}</h1>
          <p className="text-sm text-gray-500">{test.description}</p>
        </div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Asosiy menu
        </Link>
      </div>

      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
          {Array.from({ length: totalSlots }, (_, i) => i).map((index) => {
            const isCurrent = index === currentQuestionIndex;
            const isAnswered = selectedAnswers.hasOwnProperty(index);
            const baseStyle =
              "w-8 h-8 flex items-center justify-center text-xs border rounded cursor-pointer transition-colors";

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

      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between border-b border-gray-200 pb-4 mb-6 text-sm sm:text-base">
        <div className="flex gap-6">
          <span className="font-semibold text-gray-600">
            Savollar:{" "}
            <span className="text-black font-bold">
              {answeredCount}/{totalSlots}
            </span>
          </span>
          <span className="text-gray-500">1 - urinish</span>
        </div>

        <div className="flex items-center text-red-500 font-bold gap-2">
          <Clock size={18} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {currentQuestion && (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
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
                "relative p-4 rounded-lg border cursor-pointer transition-all flex items-start bg-white border-gray-200 hover:border-gray-300";
              if (isCorrectSelection) {
                style =
                  "relative p-4 rounded-lg border cursor-pointer transition-all flex items-start bg-green-50 border-green-500 shadow-sm";
              } else if (isWrongSelection) {
                style =
                  "relative p-4 rounded-lg border cursor-pointer transition-all flex items-start bg-red-50 border-red-400 shadow-sm";
              } else if (isRightAnswerRevealed) {
                style =
                  "relative p-4 rounded-lg border cursor-pointer transition-all flex items-start bg-green-50/40 border-green-400";
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={style}
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
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded border border-gray-300 text-gray-600 disabled:opacity-50 hover:bg-gray-50 flex items-center gap-2"
            >
              <ChevronLeft size={20} /> Oldingi
            </button>

            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(totalSlots - 1, prev + 1),
                )
              }
              disabled={currentQuestionIndex === totalSlots - 1}
              className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              Keyingi <ChevronRight size={20} />
            </button>
          </div>

          {isFinished && (
            <div className="mt-10 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="text-lg font-bold mb-2">Natija</h3>
              <p className="text-gray-700">
                To&apos;g&apos;ri javoblar:{" "}
                <span className="font-semibold text-green-700">
                  {correctCount}
                </span>{" "}
                / {totalSlots} ({Math.round((correctCount / totalSlots) * 100)}
                %)
              </p>
            </div>
          )}
        </div>
      )}

      <button className="fixed bottom-6 right-6 p-3 bg-white rounded-full shadow-lg border border-gray-200 text-blue-600 hover:bg-blue-50">
        <ChevronRight className="-rotate-90" size={24} />
      </button>
    </div>
  );
}
