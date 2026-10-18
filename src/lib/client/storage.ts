import { type DailyResult, CzytajDaily } from "../core/daily";
import {ReadDemo, type DemoState} from '../core/demo'
import { DecodeRecords, type GameRecord } from '../core/record';
  import {DOMYSLNE, type Settings} from '../core/settings';
import { CzytajUstawienia, ParseJson, Odpakuj, OdpakujUst } from '../core/stored';
import {Either} from '../fp/monady'
import { GetTime, RandomSeed } from './czas';

export const KEYS  = {
  records: "saper:v1:records",
  settings: "saper:v1:settings",
  daily: "saper:v1:daily",
};

function Load<T>(
  klucz: string,
  open: (koperta:unknown) => Either<string, unknown>,
  decode: (data: unknown) =>  Either<string, T>,
  zapasowy: T,
  blad : string,
): Either<string,T> {
 let surowe: string | null = null;
  try {

    surowe = window.localStorage.getItem(klucz);
  } catch {
    return Either.left(blad);   
  }
  if(surowe === null) return Either.right(zapasowy);
    return ParseJson(surowe)
    .chain(open)  
    .chain(decode)
    .mapLeft(() => blad);
}

function Zapisz(klucz: string, data: unknown, wersja: number): string | null {
  try { 
    window.localStorage.setItem(klucz, JSON.stringify({ version: wersja, data: data }));
    return null
  } catch {   
    return "Nie udało się zapisać danych w przeglądarce";
  }
 }

export const SaveDaily = (daily: ReadonlyArray<DailyResult>) => Zapisz(KEYS.daily, daily, 1);  


export const ZapiszUstawienia = (settings: Settings) => Zapisz(KEYS.settings, settings,  2);

export const SaveRecords = (rekordy: ReadonlyArray<GameRecord>) => Zapisz(KEYS.records, rekordy, 1)
const DEMO_KEY = "saper:v1:demo";

export function WczytajDemo(): DemoState | null {
  let raw = null;
  try {
    raw = window.sessionStorage.getItem(DEMO_KEY);
  } catch {
    return null;
  }  
  if(raw === null) return null;
  return ParseJson(raw)  
   .chain(ReadDemo)
    .fold<DemoState | null>(
      () => null,
      (state) => state,
    ); 
}


export const SaveDemo = (state: DemoState): string | null => {

  try {
    window.sessionStorage.setItem(DEMO_KEY, JSON.stringify(state));
    return null;


  } catch {
    return "Nie udało się zapamiętać trybu demonstracyjnego";
  }
}

export const WyczyscDemo = (): string | null => {
  try {  
    window.sessionStorage.removeItem(DEMO_KEY);
    return null;
  } catch {
    return "Nie udało się wyłączyć trybu demonstracyjnego";
  }
}


export type Boot = {
  settings: Settings;
   records: ReadonlyArray<GameRecord>;
 daily: ReadonlyArray<DailyResult>;
  seed: number;
  now: number;
  code: string | null;
  demo: DemoState | null;
  warnings: string[];
  }
export function LoadAll(): Boot {
  const warnings: string[] = [];


  const ust = Load( 
    KEYS.settings,
    OdpakujUst,   
    CzytajUstawienia,
    DOMYSLNE, 
    "Nie udało się odczytać zapisanych ustawień. Przywrócono domyślne.", 
  );
  ust.fold(
      (w) =>  warnings.push(w),
    () => 0,
  );

  const rekordy = Load<GameRecord[]>(
    KEYS.records,
    Odpakuj,
    DecodeRecords,
    [],
    "Nie udało się odczytać zapisanych wyników. Zaczynasz od zera.",
  )
  rekordy.fold(
    (w) => warnings.push(w),
    () => 0,
  );

  const daily =  Load<DailyResult[]>(
    KEYS.daily,
    Odpakuj,
    CzytajDaily,
    [],
    "Nie udało się odczytać wyników planszy dnia. Seria zaczyna się od nowa.",
 );
  daily.fold( 
      (w) => warnings.push(w),
   () =>  0,
  );

  const data = {   
    settings: ust.getOrElse(DOMYSLNE),
    records: rekordy.getOrElse([]),
    daily:daily.getOrElse([]),
    seed: RandomSeed(),
    now: GetTime(),
    code: new URLSearchParams(window.location.search).get("kod"),
    demo: WczytajDemo(),
    warnings,
  };
   console.log("start", data);
  return data;  
}
