import { Either } from "../fp/monady";
import {ValidateConfig} from "./config";
import { LayoutFromCode } from "./mines";
import type { Config } from "./types";

export type GameCode  = { config: Config; seed: number };

  export const MakeCode =  (config: Config, seed: number): string =>
  "S1-" + config.rows + "x" + config.cols + "-" + config.mines + "-" + seed.toString(36);

export function CzytajKod(input: string): Either<string, GameCode> {
  const txt = input.trim().toLowerCase().replace(/^s1/, "S1");
  const m = /^S1-(\d{1,2})x(\d{1,2})-(\d{1,4})-([0-9a-z]{1,7})$/.exec(txt);
  if (m === null) return Either.left("Nieprawidłowy kod planszy");

  const seed = parseInt(m[4], 36);
  if (seed > 0x7fffffff) return Either.left("Nieprawidłowy kod planszy");

  const kod={
    config: { rows: Number(m[1]), cols: Number(m[2]), mines: Number(m[3]) },
    seed,
  };
  return ValidateConfig(kod.config)
    .chain(() => LayoutFromCode(kod.config, kod.seed))
    .map(() => kod);
}
