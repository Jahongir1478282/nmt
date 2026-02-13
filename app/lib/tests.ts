/** @format */

import generalQuestions from "../../data/questions2.json";
import cryptoQuestions from "../../data/cryptotest.json";
import kmaQuestions from "../../data/kma.json";
import zkuQuestions from "../../data/zku.json";
import strategiyaQuestions from "../../data/strategiya.json";
import pedQuestions from "../../data/ped.json";
import innovationQuestions from "../../data/innovatsion.json";
import yvkQuestions from "../../data/yvk.json";

export interface Question {
  id?: number;
  question: string;
  options: string[];
  correct_answer?: string;
}

export interface TestConfig {
  title: string;
  questions: Question[];
  randomCount?: number;
  durationSeconds?: number;
}

// Small helpers to build mixed test pools without repeating logic elsewhere.
const takeRandom = <T>(source: T[], count: number): T[] => {
  const pool = [...source];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
};

const shuffle = <T>(source: T[]): T[] => takeRandom(source, source.length);

const cryptoPool = (cryptoQuestions as { questions: Question[] }).questions;
const kmaPool = (kmaQuestions as { questions: Question[] }).questions;
const zkuPool = (zkuQuestions as { questions: Question[] }).questions;

const mixSpecialistQuestions: Question[] = shuffle([
  ...takeRandom(cryptoPool, 20),
  ...takeRandom(kmaPool, 20),
  ...takeRandom(zkuPool, 20),
]);

export const tests = {
  strategiya: {
    title: "Yangi O'zbekistonning taraq. str. va jamiyatning ma'naviy asoslari",
    questions: (strategiyaQuestions as unknown as { questions: Question[] })
      .questions,
    durationSeconds: 60 * 80,
  },
  ped: {
    title: "Pedagogik faoliyatda raqamli kompetensiyalar",
    questions: (pedQuestions as unknown as { questions: Question[] }).questions,
    durationSeconds: 60 * 80,
  },
  innovation: {
    title: "Ilmiy va innovatsion faoliyatni rivojlantirish",
    questions: (innovationQuestions as unknown as { questions: Question[] })
      .questions,
    durationSeconds: 60 * 80,
  },
  KMA: {
    title: "Kriptografiyanig matematik asosi",
    questions: (kmaQuestions as { questions: Question[] }).questions,
    durationSeconds: 60 * 60,
  },
  YVK: {
    title: "Yengil vaznli kriptografiya va Post-kvant kriptografiya",
    questions: (yvkQuestions as unknown as { questions: Question[] }).questions,
    durationSeconds: 60 * 80,
  },
  ZKU: {
    title: "Zamonaviy kriptotahlil usullari",
    questions: (zkuQuestions as { questions: Question[] }).questions,
    durationSeconds: 60 * 80,
  },
  crypto: {
    title: "Kriptografik protokollar",
    questions: (cryptoQuestions as { questions: Question[] }).questions,
    durationSeconds: 60 * 60,
  },
  general: {
    title: "Umumiy kirish testlari",
    questions: generalQuestions as Question[],
    randomCount: 100,
    durationSeconds: 60 * 80,
  },
  mix: {
    title: "Umumiy mutaxassisliklar",
    questions: mixSpecialistQuestions,
    durationSeconds: 60 * 90,
  },
};

export type TestKey = keyof typeof tests;
