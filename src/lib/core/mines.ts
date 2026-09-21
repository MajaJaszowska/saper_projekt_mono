import { Either } from "../fp/monady";
import { allPos, ileMinObok, nowaPlansza, PUSTE_POLE, mapujPlansze, klucz } from "./plansza";
import { tasuj } from "./random";
import type { Board, Config, Pos } from "./types";

export const losujMiny = (config: Config, seed: number, bezpieczne: ReadonlyArray<Pos>): Board => {
  const bezp = new Set(bezpieczne.map(klucz));
  const kandydaci = allPos(config).filter((pos) => !bezp.has(klucz(pos)));
  const miny = new Set(tasuj(seed, kandydaci).slice(0, config.mines).map(klucz));

  const zMinami = nowaPlansza(config.rows, config.cols, (pos) => ({
    ...PUSTE_POLE,
    mine: miny.has(klucz(pos)),
  }));

  return mapujPlansze((cell, pos) => ({ ...cell, adjacent: ileMinObok(zMinami, pos) }), zMinami);
};

export type FixedLayout = Readonly<{ board: Board; start: Pos }>;

export function ukladZKodu(config: Config, seed: number): Either<string, FixedLayout> {
  for (let i = 0; i < 100; i++) {
    const plansza = losujMiny(config, seed + i, []);
    const zera = allPos(config).filter(
      (pos) => !plansza[pos.row][pos.col].mine && plansza[pos.row][pos.col].adjacent === 0,
    );
    const start = tasuj(seed + i, zera)[0];
    if (start !== undefined) {
      return Either.right({ board: plansza, start: start });
    }
  }
  return Either.left("Nie udało się ułożyć planszy z bezpiecznym polem startowym");
}
