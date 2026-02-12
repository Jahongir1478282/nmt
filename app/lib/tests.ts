/** @format */

import generalQuestions from "../../questions2.json";
import cryptoQuestions from "../../cryptotest.json";
import kmaQuestions from "../../kma.json";

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
  durationSeconds?: number;
}

export const tests = {
  general: {
    title: "Umumiy testlar",
    description: `Asosiy savollar to'plami (${100} ta tasodifiy)`,
    questions: generalQuestions as Question[],
    randomCount: 100,
    durationSeconds: 60 * 80,
  },
  crypto: {
    title: "Kriptografik protokollar",
    description: "Mutaxassislik bo'yicha savollar",
    questions: (cryptoQuestions as { questions: Question[] }).questions,
    durationSeconds: 60 * 60,
  },
  KMA: {
    title: "Kriptografiyanig matematik asosi",
    description: "Mutaxassislik bo'yicha savollari ",
    questions: (kmaQuestions as { questions: Question[] }).questions,
    durationSeconds: 60 * 60,
  },
  fintech: {
    title: "Muxassislik 3 (vaqtinchalik umumiy)",
    description: "Mutaxassislik savollari (100 ta tasodifiy)",
    questions: generalQuestions as Question[],
    randomCount: 100,
    durationSeconds: 60 * 80,
  },
  fintechh: {
    title: "Muxassislik 4 (vaqtinchalik umumiy)",
    description: "Mutaxassislik savollari (100 ta tasodifiy)",
    questions: generalQuestions as Question[],
    randomCount: 100,
    durationSeconds: 60 * 80,
  },
};

export type TestKey = keyof typeof tests;
