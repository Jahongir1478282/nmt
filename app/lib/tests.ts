/** @format */

import generalQuestions from "../../data/questions2.json";
import cryptoQuestions from "../../data/cryptotest.json";
import kmaQuestions from "../../data/kma.json";
import zkuQuestions from "../../data/zku.json";

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

// Small helpers to build mixed test pools without repeating logic elsewhere.
const takeRandom = <T,>(source: T[], count: number): T[] => {
  const pool = [...source];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
};

const shuffle = <T,>(source: T[]): T[] => takeRandom(source, source.length);

const cryptoPool = (cryptoQuestions as { questions: Question[] }).questions;
const kmaPool = (kmaQuestions as { questions: Question[] }).questions;
const zkuPool = (zkuQuestions as { questions: Question[] }).questions;

const mixSpecialistQuestions: Question[] = shuffle([
  ...takeRandom(cryptoPool, 20),
  ...takeRandom(kmaPool, 20),
  ...takeRandom(zkuPool, 20),
]);

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
  ZKU: {
    title: "Zamonaviy kriptotahlil usullari",
    description: "Zamonaviy kriptotahlil usullari savollari",
    questions: (zkuQuestions as { questions: Question[] }).questions,
    durationSeconds: 60 * 80,
  },
  mix: {
    title: "Umumiy mutaxassisliklar",
    description: "Har bir to'plamdan 20 tadan (KP, KMA, ZKU) — jami 60 savol",
    questions: mixSpecialistQuestions,
    durationSeconds: 60 * 90,
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
