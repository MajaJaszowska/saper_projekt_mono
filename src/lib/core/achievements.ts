import * as R from "ramda";
import {MaxStreak, type DailyResult} from "./daily";
import type { GameRecord } from "./record";
import { Streaks } from "./statystyki";
import type { PresetKey } from "./types";

export type Progress = Readonly<{
  records: ReadonlyArray<GameRecord>;
  daily: ReadonlyArray<DailyResult>
}>;

export type Achievement = Readonly<{
  id: string;
  title: string;
  description: string;
  test: (postep: Progress) => boolean;
}>;

type RecordTest = (rekord: GameRecord) => boolean;
 const Wygrana: RecordTest =  R.prop("won");
const NaPoziom = (poziom: PresetKey): RecordTest => R.propEq(poziom, "presetKey");
const SzybciejNiz =
  (seconds: number): RecordTest =>
  (rekord) =>
    rekord.timeSec < seconds;
const NoFlags: RecordTest = R.propEq(0, "flagsUsed");

const Some =
  (...tests: RecordTest[]) =>
  ({ records }: Progress): boolean =>
    records.some(R.allPass(tests));
const CoNajmniej =
  (count: number, ...tests: RecordTest[]) =>
  ({ records }: Progress): boolean =>
    records.filter(R.allPass(tests)).length >= count;

export const ODZNAKI: ReadonlyArray<Achievement> = [
  {
    id: "first-win",
    title: "Pierwsza wygrana",
    description: "Wygraj dowolną grę.",
    test: Some(Wygrana),
  },
  {
	  id: "ten-wins",
    title: "Dziesiątka",
    description: "Wygraj 10 gier.",
    test : CoNajmniej(10, Wygrana),
  },
  {
    id: "fifty-wins",
    title: "Pół setki",
    description: "Wygraj 50 gier.",
    test: CoNajmniej(50, Wygrana),
  },
  {
    id: "veteran",
    title: "Weteranka",
    description: "Rozegraj 100 gier (wygrane i przegrane).",
    test: CoNajmniej(100),
  },
  {
    id: "intermediate-win",
    title: "Krok wyżej",
    description: "Wygraj grę na poziomie średnim.",
    test: Some(Wygrana, NaPoziom("intermediate")),
  },
  {
    id: "expert-win",
    title: "Ekspertka",
    description: "Wygraj grę na poziomie eksperta.",
    test: Some(Wygrana, NaPoziom("expert")),
  },
  {
    id: "all-levels",
    title: "Komplet",
    description: "Wygraj na każdym z trzech poziomów.",
    test: R.allPass([
      Some(Wygrana, NaPoziom("beginner")),
      Some(Wygrana, NaPoziom("intermediate")),
      Some(Wygrana, NaPoziom("expert")),
    ]),
  },
  {
    id: "fast-beginner",
    title: "Szybka ręka",
    description: "Wygraj na poziomie początkującym w mniej niż 60 s.",
      test: Some(Wygrana, NaPoziom("beginner"), SzybciejNiz(60)),
  },
  {
    id: "lightning",
    title: "Błyskawica",
	  description: "Wygraj na początkującym poniżej 30 s albo na średnim poniżej 120 s.",
    test: R.anyPass([
      Some(Wygrana, NaPoziom("beginner"), SzybciejNiz(30)),
      Some(Wygrana, NaPoziom("intermediate"), SzybciejNiz(120)),
    ]),
  },
  {
    id: "no-flags",
    title: "Bez flag",
    description: "Wygraj grę, nie stawiając ani jednej flagi.",
    test: Some(Wygrana, NoFlags),
  },
  {
    id: "streak-5",
    title: "Seria 5",
    description: "Wygraj 5 gier z rzędu.",
    test: ({ records }) => Streaks(records).best >= 5,
  },
  {
    id: "daily-3",
    title: "Trzy dni z rzędu",
    description: "Wygraj planszę dnia w 3 kolejnych dniach.",
    test: ({ daily }) => MaxStreak(daily) >= 3,
  },
];

export type AchievementStatus = Readonly<{ achievement: Achievement; unlocked: boolean }>;

export const SprawdzOdznaki = (postep: Progress): AchievementStatus[] =>
  ODZNAKI.map((achievement) => ({ achievement, unlocked: achievement.test(postep) }));

export const IleOdblokowanych = (postep: Progress): number =>
  SprawdzOdznaki(postep).filter(R.prop("unlocked")).length;
