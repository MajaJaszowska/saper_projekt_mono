import * as R from "ramda";
import {Either, Sequence} from "../fp/monady";
import { PRESETS } from "./config";
import { DateFromNr, NrDnia } from "./statystyki";
import {IsLiczba, IsObject} from "./stored";
import type { Config } from "./types";
export const CONFIG_DNIA: Config = PRESETS.intermediate;

export type DailyResult = Readonly<{
  dateKey: string;
  won: boolean;
  timeSec: number;
}>;

const DATE_KEY  = /^\d{4}-\d{2}-\d{2}$/;

export const IsDateKey = (wartosc: unknown): wartosc is string =>
  typeof wartosc === "string" &&
  DATE_KEY.test(wartosc) &&
  !Number.isNaN(Date.parse(`${wartosc}T00:00:00Z`)) &&
  new Date(`${wartosc}T00:00:00Z`).toISOString().slice(0, 10) === wartosc;

export const DzisKlucz = (teraz: number, utcOffsetMinutes: number): string =>
  DateFromNr(NrDnia(teraz, utcOffsetMinutes));

export const SeedDnia = (dateKey: string): number => {
  const hash = [...dateKey].reduce(
    (acc, znak) => Math.imul(acc ^ znak.charCodeAt(0), 0x01000193),
    0x811c9dc5,
  );
  return (hash >>> 0) & 0x7fffffff;
};


export function AlreadyPlayed(results: ReadonlyArray<DailyResult>, dateKey: string){
  for (let i = 0; i < results.length; i++) {

    if(results[i].dateKey === dateKey) return true;
  }
  return false;
}

export const DodajDaily = (
  results: ReadonlyArray<DailyResult>,   
  wynik: DailyResult,
): DailyResult[] =>
  AlreadyPlayed(results, wynik.dateKey)
      ? [...results]  
    : R.takeLast(400, R.sortBy(R.prop("dateKey"), [...results, wynik]));

const DayNumber = (dateKey: string) => Date.parse(dateKey + "T00:00:00Z") / 86400000

const WygraneDni  = (results: ReadonlyArray<DailyResult>): number[] =>
  R.uniq(results.filter(R.prop("won")).map((wynik) => DayNumber(wynik.dateKey))).sort(
    (a, b) => a - b,
  );
export const MaxStreak = (results: ReadonlyArray<DailyResult>): number => {
  const dni = WygraneDni(results);
  let best = 0;
  let run = 0
  for (let i = 0; i < dni.length; i++) {
    if (i > 0 && dni[i] === dni[i - 1] + 1) run++;
    else run = 1;
    if (run > best) best = run;
  }
  return best;
};
export const SeriaDzienna =  (results: ReadonlyArray<DailyResult>, dzis: string): number => {
  const dni         = new Set(WygraneDni(results));
  const todayNumber = DayNumber(dzis);

  const start = dni.has(todayNumber) ? todayNumber : todayNumber - 1;

  let seria         = 0;
  while(dni.has(start - seria)) seria += 1;
  return seria;

};

const DecodeResult = (wartosc: unknown, index: number): Either<string, DailyResult> =>
  IsObject(wartosc) &&
  IsDateKey(wartosc.dateKey) &&
  typeof wartosc.won === "boolean" &&
  IsLiczba(wartosc.timeSec)
    ? Either.right({
        dateKey: wartosc.dateKey,
        won: wartosc.won,
        timeSec : wartosc.timeSec as number,
      })
    : Either.left(`Wynik planszy dnia nr ${index + 1} ma nieprawidłowy format`);

export const CzytajDaily = (wartosc: unknown): Either<string, DailyResult[]> =>
  Array.isArray(wartosc)
    ? Sequence(wartosc.map(DecodeResult)).map((results) =>
        results.reduce<DailyResult[]>(DodajDaily, []),
      )
    : Either.left("Zapisane wyniki planszy dnia mają nieprawidłowy format");
