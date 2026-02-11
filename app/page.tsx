/** @format */

"use client";

/** @format */

import Link from "next/link";
import { tests } from "./lib/tests";

export default function HomePage() {
  const generalTest = tests.general;
  const generalCount = generalTest?.questions.length ?? 0;

  return (
    <div className="min-h-screen bg-white p-6 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Asosiy menu</h1>
        <p className="text-sm text-gray-600 mb-6">
          Umumiy testlar soni: <span className="font-semibold text-gray-900">{generalCount}</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries(tests).map(([slug, test]) => (
            <Link
              key={slug}
              href={`/tests/${slug}`}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-sm transition"
            >
              <div className="text-lg font-semibold text-gray-900">{test.title}</div>
              <div className="text-sm text-gray-600">{test.description}</div>
              <div className="mt-2 text-xs text-gray-500">
                {'randomCount' in test && test.randomCount ? `${test.randomCount} ta random savol` : `${test.questions.length} ta savol`}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
