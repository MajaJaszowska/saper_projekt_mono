import { type DailyResult, czytajDaily } from "../core/daily";
import { czytajDemo, type DemoState } from "../core/demo";
import { decodeRecords, type GameRecord } from "../core/record";
import { DOMYSLNE, type Settings } from "../core/settings";
import { czytajUstawienia, parseJson, odpakuj, odpakujUst } from "../core/stored";
import { Either } from "../fp/monady";
import { getTime, losowySeed } from "./czas";

export const KEYS = {
  records: "saper:v1:records",
  settings: "saper:v1:settings",
  daily: "saper:v1:daily",
};

function load<T>(
  klucz: string,
  open: (koperta: unknown) => Either<string, unknown>,
  decode: (data: unknown) => Either<string, T>,
  zapasowy: T,
  blad: string,
): Either<string, T> {
  let surowe: string | null = null;
  try {
    surowe = window.localStorage.getItem(klucz);
  } catch {
    return Either.left(blad);
  }
  if (surowe === null) return Either.right(zapasowy);
  return parseJson(surowe)
    .chain(open)
    .chain(decode)
    .mapLeft(() => blad);
}

function zapisz(klucz: string, data: unknown, wersja: number): string | null {
  try {
    window.localStorage.setItem(klucz, JSON.stringify({ version: wersja, data: data }));
    return null;
  } catch {
    return "Nie udało się zapisać danych w przeglądarce";
  }
}

export const zapiszDaily = (daily: ReadonlyArray<DailyResult>) => zapisz(KEYS.daily, daily, 1);

export const zapiszUstawienia = (settings: Settings) => zapisz(KEYS.settings, settings, 2);

export const zapiszRekordy = (rekordy: ReadonlyArray<GameRecord>) => zapisz(KEYS.records, rekordy, 1);

const DEMO_KEY = "saper:v1:demo";

export function wczytajDemo(): DemoState | null {
  let raw = null;
  try {
    raw = window.sessionStorage.getItem(DEMO_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  return parseJson(raw)
    .chain(czytajDemo)
    .fold<DemoState | null>(
      () => null,
      (state) => state,
    );
}

export const zapiszDemo = (state: DemoState): string | null => {
  try {
    window.sessionStorage.setItem(DEMO_KEY, JSON.stringify(state));
    return null;
  } catch {
    return "Nie udało się zapamiętać trybu demonstracyjnego";
  }
};

export const wyczyscDemo = (): string | null => {
  try {
    window.sessionStorage.removeItem(DEMO_KEY);
    return null;
  } catch {
    return "Nie udało się wyłączyć trybu demonstracyjnego";
  }
};

export type Boot = {
  settings: Settings;
  records: ReadonlyArray<GameRecord>;
  daily: ReadonlyArray<DailyResult>;
  seed: number;
  now: number;
  code: string | null;
  demo: DemoState | null;
  warnings: string[];
};

export function wczytajWszystko(): Boot {
  const warnings: string[] = [];

  const ust = load(
    KEYS.settings,
    odpakujUst,
    czytajUstawienia,
    DOMYSLNE,
    "Nie udało się odczytać zapisanych ustawień. Przywrócono domyślne.",
  );
  ust.fold(
    (w) => warnings.push(w),
    () => 0,
  );

  const rekordy = load<GameRecord[]>(
    KEYS.records,
    odpakuj,
    decodeRecords,
    [],
    "Nie udało się odczytać zapisanych wyników. Zaczynasz od zera.",
  );
  rekordy.fold(
    (w) => warnings.push(w),
    () => 0,
  );

  const daily = load<DailyResult[]>(
    KEYS.daily,
    odpakuj,
    czytajDaily,
    [],
    "Nie udało się odczytać wyników planszy dnia. Seria zaczyna się od nowa.",
  );
  daily.fold(
    (w) => warnings.push(w),
    () => 0,
  );

  const data = {
    settings: ust.getOrElse(DOMYSLNE),
    records: rekordy.getOrElse([]),
    daily: daily.getOrElse([]),
    seed: losowySeed(),
    now: getTime(),
    code: new URLSearchParams(window.location.search).get("kod"),
    demo: wczytajDemo(),
    warnings,
  };
  console.log("start", data);
  return data;
}
