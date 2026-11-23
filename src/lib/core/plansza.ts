import * as R from "ramda";
import { Maybe } from "../fp/monady";
import { memoize } from "../fp/helperki";
import type { Board, Cell, Mark, Pos, Size } from "./types";

export const PUSTE_POLE: Cell = { mine: false, adjacent: 0, revealed: false, mark: "none" };

export const nowaPlansza = (wiersze: number, cols: number, fillCell: (pos: Pos) => Cell): Board => {
  const plansza: Cell[][] = [];
  for (let row = 0; row < wiersze; row++) {
    const tmp: Cell[] = [];
    for (let col = 0; col < cols; col++) {
      tmp.push(fillCell({ row, col }));
    }
    plansza.push(tmp);
  }
  return plansza;
};

export const rozmiarOf = (plansza: Board): Size => ({
  rows: plansza.length,
  cols: plansza[0]?.length ?? 0,
});

export const samePos = (a: Pos, b: Pos) => a.row == b.row && a.col == b.col;

export const klucz = (pos: Pos): string => `${pos.row},${pos.col}`;

export const poleAt = (plansza: Board, pos: Pos): Maybe<Cell> =>
  Maybe.fromNullable(plansza[pos.row]?.[pos.col]);

export function allPos(size: Size): Pos[] {
  const arr: Pos[] = [];
  for (let row = 0; row < size.rows; row++) {
    for (let col = 0; col < size.cols; col++) arr.push({ row, col });
  }
  return arr;
}

const sasiedzi2 = memoize(
  (wiersze: number, cols: number, row: number, col: number): ReadonlyArray<Pos> => {
    const res: Pos[] = [];
    const gora = row - 1 >= 0;
    const dol = row + 1 < wiersze;
    const lewo = col - 1 >= 0;
    const prawo = col + 1 < cols;
    if (gora && lewo) res.push({ row: row - 1, col: col - 1 });
    if (gora) res.push({ row: row - 1, col: col });
    if (gora && prawo) res.push({ row: row - 1, col: col + 1 });
    if (lewo) res.push({ row: row, col: col - 1 });
    if (prawo) res.push({ row: row, col: col + 1 });
    if (dol && lewo) res.push({ row: row + 1, col: col - 1 });
    if (dol) res.push({ row: row + 1, col: col });
    if (dol && prawo) res.push({ row: row + 1, col: col + 1 });
    return res;
  },
  (wiersze, cols, row, col) => `${wiersze},${cols},${row},${col}`,
);

export const neigbours = (size: Size, pos: Pos): ReadonlyArray<Pos> =>
  sasiedzi2(size.rows, size.cols, pos.row, pos.col);

const mapRow = (row: ReadonlyArray<Cell>, fn: (pole: Cell, col: number) => Cell) => {
  const zmapowane = row.map(fn);
  return zmapowane.every((pole, col) => pole === row[col]) ? row : zmapowane;
};

export const mapujPlansze = (fn: (pole: Cell, pos: Pos) => Cell, plansza: Board): Board => {
  const zmapowane = plansza.map((pola, row) => mapRow(pola, (pole, col) => fn(pole, { row, col })));
  return zmapowane.every((pola, row) => pola === plansza[row]) ? plansza : zmapowane;
};

export const zmienPola = (
  plansza: Board,
  pozycje: ReadonlyArray<Pos>,
  fn: (pole: Cell) => Cell,
): Board => {
  const cele = new Set(pozycje.map(klucz));
  const ruszoneWiersze = new Set(pozycje.map((pos) => pos.row));

  return plansza.map((pola, row) =>
    ruszoneWiersze.has(row)
      ? mapRow(pola, (pole, col) => (cele.has(klucz({ row, col })) ? fn(pole) : pole))
      : pola,
  );
};

export function ileMinObok(plansza: Board, pos: Pos): number {
  let cnt = 0;
  neigbours(rozmiarOf(plansza), pos).forEach((n) => {
    if (plansza[n.row][n.col].mine) cnt = cnt + 1;
  });
  return cnt;
}

export const policzZnaczniki = (znacznik: Mark, plansza: Board): number =>
  R.sum(plansza.map((pola) => pola.filter((pole) => pole.mark === znacznik).length));
