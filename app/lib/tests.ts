/** @format */

import generalQuestions from "../../questions2.json";
import cryptoQuestions from "../../cryptotest.json";

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer?: string;
}

export interface TestConfig {
  title: string;
  description: string;
  questions: Question[];
  randomCount?: number;
}

export const tests = {
  general: {
    title: "Umumiy testlar",
    description: "Asosiy savollar to'plami (100 ta tasodifiy)",
    questions: generalQuestions as Question[],
    randomCount: 100,
  },
  crypto: {
    title: "Kriptografiya",
    description: "Mutaxassislik bo'yicha savollar",
    questions: (cryptoQuestions as { questions: Question[] }).questions,
  },
  ai: {
    title: "Muxassislik 2 (vaqtinchalik umumiy)",
    description: "Mutaxassislik savollari (100 ta tasodifiy)",
    questions: generalQuestions as Question[],
    randomCount: 100,
  },
  fintech: {
    title: "Muxassislik 3 (vaqtinchalik umumiy)",
    description: "Mutaxassislik savollari (100 ta tasodifiy)",
    questions: generalQuestions as Question[],
    randomCount: 100,
  },
  fintechh: {
    title: "Muxassislik 4 (vaqtinchalik umumiy)",
    description: "Mutaxassislik savollari (100 ta tasodifiy)",
    questions: generalQuestions as Question[],
    randomCount: 100,
  },
};

export type TestKey = keyof typeof tests;
