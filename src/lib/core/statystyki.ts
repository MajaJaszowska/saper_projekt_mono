import * as R from "ramda";
import { Maybe } from "../fp/monady";
import { PRESET_KEYS } from "./config";
import type { GameRecord } from "./record";
import type { PresetKey } from "./types";

type Records = ReadonlyArray<GameRecord>;

export type Stats = {
  played: number;
  won: number;
  totalTimeSec: number;
  bestTimeSec: Maybe<number>;
  clicks: number;
};

export function agreguj(rekordy: Records): Stats {
  let played = 0;
  let won = 0;
  let czas = 0;
  let klikniecia = 0;
  let best: number | null = null;
  for (let i = 0; i < rekordy.length; i++) {
    const r = rekordy[i];
    played++;
    czas = czas + r.timeSec;
    klikniecia += r.clicks;
    if (r.won) {
      won++;
      if (best === null || r.timeSec < best) best = r.timeSec;
    }
  }
  return {
    played,
    won,
    totalTimeSec: czas,
    bestTimeSec: Maybe.fromNullable(best),
    clicks: klikniecia,
  };
}

export const procent = (statystyki: Stats): number =>
  statystyki.played === 0 ? 0 : Math.round((statystyki.won / statystyki.played) * 100);

export const sredniCzas = (rekordy: Records): Maybe<number> => {
  const czasy = rekordy.filter((r) => r.won).map((r) => r.timeSec);
  if (czasy.length == 0) return Maybe.nothing();
  return Maybe.just(Math.round(R.mean(czasy)));
};

export const filtrPoziom = (preset: PresetKey | "all", rekordy: Records): Records =>
  preset === "all" ? rekordy : rekordy.filter((r) => r.presetKey === preset);

const chronologicznie = R.sortBy<GameRecord>(R.prop("finishedAt"));

export function top10(preset: PresetKey, rekordy: Records): GameRecord[] {
  const wygrane = rekordy.filter((r) => r.won && r.presetKey === preset && r.kind === "normal");
  const sorted = R.sortWith<GameRecord>(
    [R.ascend(R.prop("timeSec")), R.ascend(R.prop("finishedAt"))],
    wygrane,
  );
  return sorted.slice(0, 10);
}

export const rankOf = (rekord: GameRecord, rekordy: Records): Maybe<number> => {
  const idx = top10(rekord.presetKey, rekordy).findIndex((r) => r.id === rekord.id);
  return idx === -1 ? Maybe.nothing() : Maybe.just(idx + 1);
};

export const serie = (rekordy: Records) => {
  let current = 0;
  let best = 0;
  chronologicznie(rekordy).forEach((rekord) => {
    if (rekord.won) current = current + 1;
    else current = 0;
    if (current > best) best = current;
  });
  return { current, best };
};

export const ostatnieGry = (rekordy: Records, n: number) =>
  R.takeLast(n, chronologicznie(rekordy)).map((rekord) => ({
    id: rekord.id,
    timeSec: rekord.timeSec,
    won: rekord.won,
    date: rekord.finishedAt,
    presetKey: rekord.presetKey,
  }));

export const wygranePoPresecie = (rekordy: Records) => {
  return PRESET_KEYS.map((presetKey) => {
    const s = agreguj(rekordy.filter((r) => r.presetKey === presetKey));
    return { presetKey, played: s.played, won: s.won };
  });
};

const DZIEN_MS = 24 * 60 * 60 * 1000;

export const filtrDni = (rekordy: Records, dni: number | null, teraz: number): Records => {
  if (dni === null) return rekordy;
  return rekordy.filter((rekord) => Date.parse(rekord.finishedAt) >= teraz - dni * DZIEN_MS);
};

export const winRate = (rekordy: Records, okno: number) => {
  const posortowane = chronologicznie(rekordy);

  return posortowane.map((rekord, idx) => {
    const wycinek = posortowane.slice(Math.max(0, idx - okno + 1), idx + 1);
    return {
      id: rekord.id,
      date: rekord.finishedAt,
      rate: procent(agreguj(wycinek)),
      games: wycinek.length,
    };
  });
};

export type ActivityDay = {
  date: string;
  week: number;
  weekday: number;
  count: number;
  future: boolean;
};

export const nrDnia = (time: number, utcOffsetMinutes: number): number =>
  Math.floor((time + utcOffsetMinutes * 60000) / DZIEN_MS);

export const dataZNr = (nr: number): string => new Date(nr * 86400000).toISOString().slice(0, 10);

export const dniAktywnosci = (
  rekordy: Records,
  teraz: number,
  utcOffsetMinutes: number,
  tygodnie: number,
): ActivityDay[] => {
  const dzis = nrDnia(teraz, utcOffsetMinutes);
  const dzienTygodnia = (((dzis + 3) % 7) + 7) % 7;
  const pierwszyDzien = dzis - dzienTygodnia - (tygodnie - 1) * 7;
  const liczniki: Record<string, number> = {};
  for (const rekord of rekordy) {
    const k = String(nrDnia(Date.parse(rekord.finishedAt), utcOffsetMinutes));
    liczniki[k] = (liczniki[k] ?? 0) + 1;
  }

  const dni: ActivityDay[] = [];
  for (let i = 0; i < tygodnie * 7; i++) {
    const nr = pierwszyDzien + i;
    dni.push({
      date: dataZNr(nr),
      week: Math.floor(i / 7),
      weekday: i % 7,
      count: liczniki[String(nr)] ?? 0,
      future: nr > dzis,
    });
  }
  return dni;
};

export function czasTekst(lacznieSec: number): string {
  const godziny = Math.floor(lacznieSec / 3600);
  const minuty = Math.floor((lacznieSec % 3600) / 60);
  if (godziny > 0) return `${godziny} h ${minuty} min`;
  if (minuty > 0) return `${minuty} min ${lacznieSec % 60} s`;
  return `${lacznieSec} s`;
}
