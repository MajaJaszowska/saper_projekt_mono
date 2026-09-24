import * as R from "ramda";
import { Either, sequence } from "../fp/monady";
import { PRESETS } from "./config";
import { dataZNr, nrDnia } from "./statystyki";
import { isLiczba, czyObiekt } from "./stored";
import type { Config } from "./types";

export const CONFIG_DNIA: Config = PRESETS.intermediate;

export type DailyResult = Readonly<{
  dateKey: string;
  won: boolean;
  timeSec: number;
}>;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const isDateKey = (wartosc: unknown): wartosc is string =>
  typeof wartosc === "string" &&
  DATE_KEY.test(wartosc) &&
  !Number.isNaN(Date.parse(`${wartosc}T00:00:00Z`)) &&
  new Date(`${wartosc}T00:00:00Z`).toISOString().slice(0, 10) === wartosc;

export const dzisKlucz = (teraz: number, utcOffsetMinutes: number): string =>
  dataZNr(nrDnia(teraz, utcOffsetMinutes));

export const seedDnia = (dateKey: string): number => {
  const hash = [...dateKey].reduce(
    (acc, znak) => Math.imul(acc ^ znak.charCodeAt(0), 0x01000193),
    0x811c9dc5,
  );
  return (hash >>> 0) & 0x7fffffff;
};

export function czyGral(results: ReadonlyArray<DailyResult>, dateKey: string) {
  for (let i = 0; i < results.length; i++) {
    if (results[i].dateKey === dateKey) return true;
  }
  return false;
}

export const dodajDaily = (
  results: ReadonlyArray<DailyResult>,
  wynik: DailyResult,
): DailyResult[] =>
  czyGral(results, wynik.dateKey)
    ? [...results]
    : R.takeLast(400, R.sortBy(R.prop("dateKey"), [...results, wynik]));

const numerDnia = (dateKey: string) => Date.parse(dateKey + "T00:00:00Z") / 86400000;

const wygraneDni = (results: ReadonlyArray<DailyResult>): number[] =>
  R.uniq(results.filter(R.prop("won")).map((wynik) => numerDnia(wynik.dateKey))).sort(
    (a, b) => a - b,
  );

export const maxSeria = (results: ReadonlyArray<DailyResult>): number => {
  const dni = wygraneDni(results);
  let best = 0;
  let run = 0;
  for (let i = 0; i < dni.length; i++) {
    if (i > 0 && dni[i] === dni[i - 1] + 1) run++;
    else run = 1;
    if (run > best) best = run;
  }
  return best;
};

export const seriaDzienna = (results: ReadonlyArray<DailyResult>, dzis: string): number => {
  const dni = new Set(wygraneDni(results));
  const todayNumber = numerDnia(dzis);
  const start = dni.has(todayNumber) ? todayNumber : todayNumber - 1;

  let seria = 0;
  while (dni.has(start - seria)) seria += 1;
  return seria;
};

const decodeResult = (wartosc: unknown, index: number): Either<string, DailyResult> =>
  czyObiekt(wartosc) &&
  isDateKey(wartosc.dateKey) &&
  typeof wartosc.won === "boolean" &&
  isLiczba(wartosc.timeSec)
    ? Either.right({
        dateKey: wartosc.dateKey,
        won: wartosc.won,
        timeSec: wartosc.timeSec as number,
      })
    : Either.left(`Wynik planszy dnia nr ${index + 1} ma nieprawidłowy format`);

export const czytajDaily = (wartosc: unknown): Either<string, DailyResult[]> =>
  Array.isArray(wartosc)
    ? sequence(wartosc.map(decodeResult)).map((results) =>
        results.reduce<DailyResult[]>(dodajDaily, []),
      )
    : Either.left("Zapisane wyniki planszy dnia mają nieprawidłowy format");
