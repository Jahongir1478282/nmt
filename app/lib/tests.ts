/** @format */

import generalQuestions from "../../data/questions2.json";
import cryptoQuestions from "../../data/cryptotest.json";
import kmaQuestions from "../../data/kma.json";
import zkuQuestions from "../../data/zku.json";
import strategiyaQuestions from "../../data/strategiya2.json";
import pedQuestions from "../../data/ped.json";
import innovationQuestions from "../../data/innovatsion.json";
import yvkQuestions from "../../data/yvk.json";
import lwcQuestions from "../../data/lwc.json";
import pqcQuestions from "../../data/pqc.json";

import huquqQuestions from "../../data/huquq.json";
import raqamliQuestions from "../../data/raqamli.json";
import sifatQuestions from "../../data/sifat.json";


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
const yvkPool = (yvkQuestions as { questions: Question[] }).questions;
const lwcPool = (lwcQuestions as { questions: Question[] }).questions;
const pqcPool = (pqcQuestions as { questions: Question[] }).questions;
const strategiyaPool = (strategiyaQuestions as { questions: Question[] }).questions;
const pedPool = (pedQuestions as { questions: Question[] }).questions;
const innovationPool = (innovationQuestions as { questions: Question[] }).questions;
const huquqPool = huquqQuestions as unknown as Question[];
const raqamliPool = (raqamliQuestions as { questions: Question[] }).questions;
const sifatPool = sifatQuestions as unknown as Question[];

const mixSpecialistQuestions: Question[] = shuffle([
  ...takeRandom(cryptoPool, 9),
  ...takeRandom(kmaPool, 9),
  ...takeRandom(zkuPool, 9),
  ...takeRandom(strategiyaPool, 9),
  ...takeRandom(pedPool, 9),
  ...takeRandom(innovationPool, 9),
  ...takeRandom(lwcPool, 9),
  ...takeRandom(pqcPool, 10),
  ...takeRandom(huquqPool, 9),
  ...takeRandom(raqamliPool, 9),
  ...takeRandom(sifatPool, 9),
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
  huquq: {
    title: "Huquqiy",
    questions: huquqPool,
    durationSeconds: 60 * 80,
  },
  raqamli: {
    title: "Raqamli kompetensiyalar",
    questions: raqamliPool,
    durationSeconds: 60 * 80,
  },
  sifat: {
    title: "Ta'lim sifati",
    questions: sifatPool,
    durationSeconds: 60 * 80,
  },
  KMA: {
    title: "Kriptografiyanig matematik asosi",
    questions: (kmaQuestions as { questions: Question[] }).questions,
    durationSeconds: 60 * 60,
  },
  // YVK: {
  //   title: "Yengil vaznli kriptografiya va Post-kvant kriptografiya",
  //   questions: (yvkQuestions as unknown as { questions: Question[] }).questions,
  //   durationSeconds: 60 * 80,
  // },
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
  LWC: {
    title: "Yengil vaznli kriptografiya (new)*",
    questions: (lwcQuestions as unknown as { questions: Question[] }).questions,
    durationSeconds: 60 * 80,
  },
  PQC: {
    title: "Post-kvant kriptografiya (new)*",
    questions: (pqcQuestions as unknown as { questions: Question[] }).questions,
    durationSeconds: 60 * 80,
  },
  general: {
    title: "Umumiy kirish testlari",
    questions: generalQuestions as Question[],
    randomCount: 100,
    durationSeconds: 60 * 80,
  },
  mix: {
    title: "Umumiy va mutaxassislik testlari aralashmasi",
    questions: mixSpecialistQuestions,
    durationSeconds: 60 * 90,
  },
};

export type TestKey = keyof typeof tests;
