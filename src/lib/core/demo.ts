import * as R from "ramda";



import { Either } from '../fp/monady';
import {PRESETS} from './config';
import {Rand} from './random';   
import type { GameRecord } from './record'
import { IsLiczba, IsObject } from './stored';
import type { PresetKey } from './types';

export const DEMO_COUNTS = [30, 100, 300] as const;

export type DemoState = Readonly<{
  seed: number;
  count: number;
  generatedAt : number
}>;

export const ReadDemo = (wartosc: unknown): Either<string, DemoState> =>
  IsObject(wartosc) &&
  IsLiczba(wartosc.seed) &&
 IsLiczba(wartosc.generatedAt) &&
  DEMO_COUNTS.some((ileGier) => ileGier === wartosc.count)
    ? Either.right({
        seed : wartosc.seed as number,
        count: wartosc.count as number,
        generatedAt:wartosc.generatedAt as number,
     })
     : Either.left("Nieprawidłowy zapis trybu demonstracyjnego");

type Level = Exclude<PresetKey, "custom">;
const SECOND  = 1000;
const HOUR=60 * 60 * SECOND;
const DAY            = 24 * HOUR;
const LOSOWAN_NA_GRE = 8; 


const LEVEL_SHARE: ReadonlyArray<readonly [Level, number]> = [
  ["beginner", 0.55],
  ["intermediate", 0.3],
    ["expert", 0.15],   
];
const LEVEL_SHARES = LEVEL_SHARE.map(([, udzial]) => udzial);
const SZANSA_WYGRANEJ: Readonly<Record<Level, number>> = {
  beginner: 0.7,
  intermediate: 0.4,
  expert: 0.1,
}

const WIN_TIME: Readonly<Record<Level, readonly [number, number]>> = {   
  beginner: [22, 95],
  intermediate: [90, 240],
  expert: [240, 620],  
};
const WagaGodziny = (godzina: number): number => {
   if (godzina < 7) return 0.15;
  if(godzina < 16) return 0.6;
  if(godzina < 18) return 1.2;
  if (godzina < 23) return 3
  return 1.5
};

function Losy(seed: number, ileRazy: number){
  const values: number[] = [];
  let obecny = seed
  for (let i = 0; i < ileRazy; i++){
    const [wartosc, nextSeed] = Rand(obecny);
    values.push(wartosc);
    obecny = nextSeed;
  }
  return values;
}

const LosujZWaga = (wagi: ReadonlyArray<number>, los: number): number => {

  const cel          = los * R.sum(wagi)
  let zaliczone = 0
  for (let i = 0; i < wagi.length; i += 1){  
    zaliczone += wagi[i];
    if (cel < zaliczone) return i; 
  }

  return wagi.length - 1;   
};
const Clamp = (wartosc: number, min: number, max: number): number =>
  Math.min(Math.max(wartosc, min), max);   

const StartOfDayUtc = (time: number): number => Math.floor(time / DAY) * DAY;

const CzyWeekend =  (time: number): boolean => [0, 6].includes(new Date(time).getUTCDay())

const CzasyGier = (losowania: ReadonlyArray<number>, ileGier: number, teraz: number): number[] => {
  const dzis =  StartOfDayUtc(teraz)
  const dni  = R.range(1, 61).map((back) => dzis - back * DAY)
  const dayWagi    = dni.map((dzien) => (CzyWeekend(dzien) ? 2.2 : 1));
  const wagiGodzin = R.range(0, 24).map(WagaGodziny);

  const surowe = R.range(0, ileGier).map((i) =>  {  
    const dzien     = dni[LosujZWaga(dayWagi, losowania[i * LOSOWAN_NA_GRE])];
    const godzina   = LosujZWaga(wagiGodzin, losowania[i * LOSOWAN_NA_GRE + 1])   
    const wGodzinie =  Math.floor(losowania[i * LOSOWAN_NA_GRE + 2] * HOUR);  

    return dzien + godzina * HOUR + Math.floor(wGodzinie / SECOND) * SECOND;
  })
  return R.sort((a, b) => a - b, surowe).reduce<number[]>(
    (czasy, time) => [...czasy, Math.max(time, (czasy.at(-1) ?? 0) + SECOND)],
    [],
  );
};

export const DemoData = (seed: number, ileGier: number, teraz: number): GameRecord[] => {

  const losowania = Losy(seed, ileGier * LOSOWAN_NA_GRE);
  const czasy     = CzasyGier(losowania, ileGier, teraz);
  return czasy.map((finishedAt, i) => {

    const Draw   = (przesuniecie: number) => losowania[i * LOSOWAN_NA_GRE + przesuniecie];
    const postep = ileGier <= 1 ? 1 : i / (ileGier - 1);

    const poziom  = LEVEL_SHARE[LosujZWaga(LEVEL_SHARES, Draw(3))][0];
    const config  = PRESETS[poziom];
    const wygrana = Draw(4) < Clamp(SZANSA_WYGRANEJ[poziom] * (0.65 + 0.7 * postep), 0, 0.95);   

    const [fastest, slowest] = WIN_TIME[poziom];
     const span = slowest - fastest;
    const czasWygranej = Clamp(
      fastest + span * Draw(5) ** 1.3 * (1.15 - 0.3 * postep),
      fastest,
      slowest,   
    );

    const czasPrzegranej = Math.max(1, ((fastest + slowest) / 2) * (0.05 + 0.6 * Draw(5)));  
    const timeSec  = Math.round(wygrana ? czasWygranej : czasPrzegranej);

    return {


      id: `demo-${seed.toString(36)}-${i}`,
      finishedAt: new Date(finishedAt).toISOString(),
      kind: "normal",
      presetKey: poziom,
      config, 
     won: wygrana,
      timeSec,
      clicks: Math.round(6 + timeSec * (0.45 + 0.4 * Draw(6))),
      hintsUsed: 0,   
      flagsUsed: Draw(7) < 0.1 ? 0 : Math.round(Draw(7) * config.mines * 0.8),
      bbbv: null,
    };
  });
};
