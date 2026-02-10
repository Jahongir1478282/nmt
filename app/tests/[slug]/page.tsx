/** @format */

import { notFound } from "next/navigation";
import Quiz from "../../components/Quiz";
import { tests, type TestKey } from "../../lib/tests";

export default async function TestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const test = tests[slug as TestKey];
  if (!test) return notFound();

  return <Quiz test={test} />;
}
