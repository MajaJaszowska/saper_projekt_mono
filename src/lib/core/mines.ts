import { Either } from "../fp/monady";
import {AllPos, IleMinObok, NowaPlansza, PUSTE_POLE, MapujPlansze, Klucz} from "./plansza";
import {Tasuj} from "./random"
 import type { Board, Config, Pos } from "./types";

export const LosujMiny = (config: Config, seed: number, bezpieczne:ReadonlyArray<Pos>): Board => {
  const bezp = new Set(bezpieczne.map(Klucz));  
  const kandydaci = AllPos(config).filter((pos) => !bezp.has(Klucz(pos)));
  const miny      = new Set(Tasuj(seed, kandydaci).slice(0, config.mines).map(Klucz));

  const zMinami = NowaPlansza(config.rows,config.cols, (pos) => ({
    ...PUSTE_POLE,
    mine: miny.has(Klucz(pos)),
  }))

  return MapujPlansze((cell, pos) => ({ ...cell, adjacent: IleMinObok(zMinami, pos) }), zMinami);
};
 export type FixedLayout = Readonly<{ board: Board; start: Pos }>;
export function LayoutFromCode(config: Config, seed: number): Either<string, FixedLayout> {  
  for (let i = 0; i < 100; i++) {
    const plansza = LosujMiny(config, seed + i, []);
    const zera            = AllPos(config).filter(
      (pos) => !plansza[pos.row][pos.col].mine && plansza[pos.row][pos.col].adjacent === 0,
     )
    const start = Tasuj(seed + i,  zera)[0];
    if (start !== undefined) {
      return Either.right({ board: plansza, start: start });
   }
  }
  return Either.left("Nie udało się ułożyć planszy z bezpiecznym polem startowym");
}
