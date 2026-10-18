import { Either } from "../fp/monady";
import type { Config, PresetKey } from "./types";


export const PRESETS: Readonly<Record<Exclude<PresetKey, "custom">, Config>> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};
export const NAZWY_POZIOMOW : Readonly<Record<PresetKey, string>> = {
 beginner: "Początkujący", 
  intermediate: "Średni",
  expert: "Ekspert",
  custom: "Własny",
}; 

export const PRESET_KEYS: ReadonlyArray<PresetKey> = ["beginner", "intermediate", "expert", "custom"];
export const LIMITY   = { minRows: 5, maxRows: 30, minCols: 5, maxCols: 40 } as const   

 export function JakiPreset(config: Config): PresetKey {
  const b = PRESETS.beginner;
  if(config.rows === b.rows && config.cols === b.cols && config.mines === b.mines) return "beginner";
  const s = PRESETS.intermediate
  if(config.rows === s.rows && config.cols === s.cols && config.mines === s.mines) return "intermediate";
  if (config.rows === 16 && config.cols === 30 && config.mines === 99) return "expert";
  return "custom";
}

export const MaxMines = (wiersze: number, cols: number): number => wiersze * cols - 9

 export const GestoscMin = (config : Config): number =>
  Math.round((config.mines / (config.rows * config.cols)) * 100);


export const ValidateConfig = (config: Config): Either<string, Config> => {

	const { rows, cols, mines } = config;
  if(!Number.isInteger(rows) || !Number.isInteger(cols) || !Number.isInteger(mines)) {
    return Either.left("Wiersze, kolumny i miny muszą być liczbami całkowitymi")
  }
  if(rows < 5 || rows > 30){
    return Either.left(`Liczba wierszy musi być od ${LIMITY.minRows} do ${LIMITY.maxRows}`);
   }

  if (cols < LIMITY.minCols || cols > LIMITY.maxCols){
	  return Either.left("Liczba kolumn musi być od 5 do 40"); 
  }
  if (mines < 1) return Either.left("Na planszy musi być co najmniej 1 mina");
  const max =  MaxMines(rows, cols);

  if(mines > max) {
    return Either.left(`Za dużo min: maksymalnie ${max} dla planszy ${rows}×${cols}`);
  }
  return Either.right(config);
};
