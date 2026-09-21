import { neigbours, klucz, rozmiarOf, zmienPola } from "./plansza";
import type { Board, Cell, Pos, RevealResult } from "./types";

const mozna = (pole: Cell): boolean => !pole.revealed && pole.mark === "none";

export function* kolejnosc(plansza: Board, start: Pos): Generator<Pos> {
  const size = rozmiarOf(plansza);
  const seen = new Set<string>([klucz(start)]);
  const kolejka: Pos[] = [start];

  while (kolejka.length > 0) {
    const pos = kolejka.shift() as Pos;
    const pole = plansza[pos.row]?.[pos.col];
    if (pole === undefined || !mozna(pole) || pole.mine) continue;

    yield pos;

    if (pole.adjacent === 0) {
      for (const sasiad of neigbours(size, pos)) {
        if (!seen.has(klucz(sasiad))) {
          seen.add(klucz(sasiad));
          kolejka.push(sasiad);
        }
      }
    }
  }
}

const pokaz = (pole: Cell): Cell => ({ ...pole, revealed: true });

export const odkryj = (plansza: Board, pos: Pos): RevealResult => {
  const pole = plansza[pos.row]?.[pos.col];
  if (pole === undefined || !mozna(pole)) {
    return { board: plansza, hitMine: false, exploded: null, order: [] };
  }

  if (pole.mine) {
    return { board: zmienPola(plansza, [pos], pokaz), hitMine: true, exploded: pos, order: [pos] };
  }

  const order = [...kolejnosc(plansza, pos)];
  return { board: zmienPola(plansza, order, pokaz), hitMine: false, exploded: null, order };
};
