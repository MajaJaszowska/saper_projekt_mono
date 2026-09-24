import { Either } from "../fp/monady";
import { sprawdzConfig } from "./config";
import { ukladZKodu } from "./mines";
import type { Config } from "./types";

export type GameCode = { config: Config; seed: number };

export const zrobKod = (config: Config, seed: number): string =>
  "S1-" + config.rows + "x" + config.cols + "-" + config.mines + "-" + seed.toString(36);

export function czytajKod(input: string): Either<string, GameCode> {
  const txt = input.trim().toLowerCase().replace(/^s1/, "S1");
  const m = /^S1-(\d{1,2})x(\d{1,2})-(\d{1,4})-([0-9a-z]{1,7})$/.exec(txt);
  if (m === null) return Either.left("Nieprawidłowy kod planszy");

  const seed = parseInt(m[4], 36);
  if (seed > 0x7fffffff) return Either.left("Nieprawidłowy kod planszy");

  const kod = {
    config: { rows: Number(m[1]), cols: Number(m[2]), mines: Number(m[3]) },
    seed,
  };
  return sprawdzConfig(kod.config)
    .chain(() => ukladZKodu(kod.config, kod.seed))
    .map(() => kod);
}
