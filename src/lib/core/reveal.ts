import { Neigbours, Klucz, RozmiarOf, UpdateCells } from "./plansza";
import type { Board, Cell, Pos, RevealResult } from "./types";

const Mozna = (pole: Cell): boolean => !pole.revealed && pole.mark === "none";

export function* FloodOrder(plansza: Board, start: Pos): Generator<Pos> {
  const size = RozmiarOf(plansza);
  const seen = new Set<string>([Klucz(start)]);
  const kolejka: Pos[] = [start];

  while (kolejka.length > 0) {
    const pos = kolejka.shift() as Pos;
    const pole = plansza[pos.row]?.[pos.col];
    if (pole === undefined || !Mozna(pole) || pole.mine) continue;

    yield pos;

    if (pole.adjacent === 0) {
      for (const sasiad of Neigbours(size, pos)) {
        if (!seen.has(Klucz(sasiad))) {
          seen.add(Klucz(sasiad));
          kolejka.push(sasiad);
        }
      }
    }
  }
}

const Pokaz = (pole: Cell): Cell => ({ ...pole, revealed: true });

export const Reveal = (plansza: Board, pos: Pos): RevealResult => {
  const pole = plansza[pos.row]?.[pos.col];
  if (pole === undefined || !Mozna(pole)) {
    return { board: plansza, hitMine: false, exploded: null, order: [] };
  }

  if (pole.mine) {
    return { board: UpdateCells(plansza, [pos], Pokaz), hitMine: true, exploded: pos, order: [pos] };
  }

  const order = [...FloodOrder(plansza, pos)];
  return { board: UpdateCells(plansza, order, Pokaz), hitMine: false, exploded: null, order };
};
