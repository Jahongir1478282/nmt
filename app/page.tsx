/** @format */

"use client";

import Link from "next/link";
import { tests, type TestConfig } from "./lib/tests";

const formatQuestionLabel = (test: TestConfig): string => {
  const hasRandomCount =
    typeof test.randomCount === "number" && test.randomCount > 0;
  const fallbackCount = test.questions?.length ?? 0;
  return hasRandomCount
    ? `${test.randomCount} ta random savol`
    : `${fallbackCount} ta savol`;
};

const baseCardClass =
  "w-full text-left p-4 rounded-lg border hover:border-blue-400 hover:shadow-sm transition";

interface CardProps {
  slug: string;
  test: TestConfig;
  index: number;
  variantClass: string;
}

const TestCard = ({ slug, test, index, variantClass }: CardProps) => (
  <Link
    key={slug}
    href={`/tests/${slug}`}
    className={`${baseCardClass} ${variantClass}`}
  >
    <div className="text-lg font-semibold text-gray-900">
      2.{index + 1}. {test.title}
    </div>
    <div className="mt-2 text-xs text-gray-500">
      {formatQuestionLabel(test)}
    </div>
  </Link>
);

export default function HomePage() {
  const generalTest = tests.general;
  const generalCount = generalTest?.questions?.length ?? 0;

  const testCards = Object.entries(tests).map(([slug, test], index) => ({
    slug,
    test,
    index,
  }));

  const sections = [
    {
      cards: testCards.slice(0, 3),
      wrapperClass:
        "grid gap-4 sm:grid-cols-2 border-b border-gray-300 pb-8 mb-8",
      variantClass: "border-gray-200",
    },
    {
      cards: testCards.slice(3, 7),
      wrapperClass:
        "grid gap-4 sm:grid-cols-2 border-b border-gray-300 pb-8 mb-8",
      variantClass: "border-blue-400",
    },
    {
      cards: testCards.slice(7),
      wrapperClass: "grid gap-4 sm:grid-cols-2",
      variantClass: "border-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-white p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold">Asosiy menu</h1>
        <p className="text-sm text-gray-600 mb-6">
          Umumiy kirish testlari soni:
          <span className="ml-1 font-semibold text-gray-900">
            {generalCount}
          </span>
        </p>
        {sections.map(
          ({ cards, wrapperClass, variantClass }, sectionIndex) =>
            cards.length > 0 && (
              <div key={sectionIndex} className={wrapperClass}>
                {cards.map(({ slug, test, index }) => (
                  <TestCard
                    key={slug}
                    slug={slug}
                    test={test}
                    index={index}
                    variantClass={variantClass}
                  />
                ))}
              </div>
            ),
        )}
      </div>
    </div>
  );
}
