import * as R from "ramda";
import { maxSeria, type DailyResult } from "./daily";
import type { GameRecord } from "./record";
import { serie } from "./statystyki";
import type { PresetKey } from "./types";

export type Progress = Readonly<{
  records: ReadonlyArray<GameRecord>;
  daily: ReadonlyArray<DailyResult>;
}>;

export type Achievement = Readonly<{
  id: string;
  title: string;
  description: string;
  test: (postep: Progress) => boolean;
}>;

type RecordTest = (rekord: GameRecord) => boolean;

const wygrana: RecordTest = R.prop("won");
const naPoziom = (poziom: PresetKey): RecordTest => R.propEq(poziom, "presetKey");
const szybciejNiz =
  (seconds: number): RecordTest =>
  (rekord) =>
    rekord.timeSec < seconds;
const noFlags: RecordTest = R.propEq(0, "flagsUsed");

const some =
  (...tests: RecordTest[]) =>
  ({ records }: Progress): boolean =>
    records.some(R.allPass(tests));
const coNajmniej =
  (count: number, ...tests: RecordTest[]) =>
  ({ records }: Progress): boolean =>
    records.filter(R.allPass(tests)).length >= count;

export const ODZNAKI: ReadonlyArray<Achievement> = [
  {
    id: "first-win",
    title: "Pierwsza wygrana",
    description: "Wygraj dowolną grę.",
    test: some(wygrana),
  },
  {
    id: "ten-wins",
    title: "Dziesiątka",
    description: "Wygraj 10 gier.",
    test: coNajmniej(10, wygrana),
  },
  {
    id: "fifty-wins",
    title: "Pół setki",
    description: "Wygraj 50 gier.",
    test: coNajmniej(50, wygrana),
  },
  {
    id: "veteran",
    title: "Weteranka",
    description: "Rozegraj 100 gier (wygrane i przegrane).",
    test: coNajmniej(100),
  },
  {
    id: "intermediate-win",
    title: "Krok wyżej",
    description: "Wygraj grę na poziomie średnim.",
    test: some(wygrana, naPoziom("intermediate")),
  },
  {
    id: "expert-win",
    title: "Ekspertka",
    description: "Wygraj grę na poziomie eksperta.",
    test: some(wygrana, naPoziom("expert")),
  },
  {
    id: "all-levels",
    title: "Komplet",
    description: "Wygraj na każdym z trzech poziomów.",
    test: R.allPass([
      some(wygrana, naPoziom("beginner")),
      some(wygrana, naPoziom("intermediate")),
      some(wygrana, naPoziom("expert")),
    ]),
  },
  {
    id: "fast-beginner",
    title: "Szybka ręka",
    description: "Wygraj na poziomie początkującym w mniej niż 60 s.",
    test: some(wygrana, naPoziom("beginner"), szybciejNiz(60)),
  },
  {
    id: "lightning",
    title: "Błyskawica",
    description: "Wygraj na początkującym poniżej 30 s albo na średnim poniżej 120 s.",
    test: R.anyPass([
      some(wygrana, naPoziom("beginner"), szybciejNiz(30)),
      some(wygrana, naPoziom("intermediate"), szybciejNiz(120)),
    ]),
  },
  {
    id: "no-flags",
    title: "Bez flag",
    description: "Wygraj grę, nie stawiając ani jednej flagi.",
    test: some(wygrana, noFlags),
  },
  {
    id: "streak-5",
    title: "Seria 5",
    description: "Wygraj 5 gier z rzędu.",
    test: ({ records }) => serie(records).best >= 5,
  },
  {
    id: "daily-3",
    title: "Trzy dni z rzędu",
    description: "Wygraj planszę dnia w 3 kolejnych dniach.",
    test: ({ daily }) => maxSeria(daily) >= 3,
  },
];

export type AchievementStatus = Readonly<{ achievement: Achievement; unlocked: boolean }>;

export const sprawdzOdznaki = (postep: Progress): AchievementStatus[] =>
  ODZNAKI.map((achievement) => ({ achievement, unlocked: achievement.test(postep) }));

export const ileOdblokowanych = (postep: Progress): number =>
  sprawdzOdznaki(postep).filter(R.prop("unlocked")).length;
