import * as R from "ramda";
import {Maybe} from "../fp/monady";
import {Memoize} from "../fp/pomocnicze";
import type { Board, Cell, Mark, Pos, Size } from "./types";


export const PUSTE_POLE: Cell = { mine: false, adjacent: 0, revealed: false, mark: "none" };

export const NowaPlansza      = (wiersze: number, cols: number, fillCell: (pos: Pos) => Cell): Board => {

  const plansza: Cell[][] = [];
  for(let row = 0; row < wiersze; row++) {
    const tmp: Cell[] = [];
   for (let col = 0; col < cols; col++) {
        tmp.push(fillCell({ row, col }));
    }
    plansza.push(tmp);
  }  
  return plansza;
};  

export const RozmiarOf = (plansza: Board): Size => ({
  rows: plansza.length,
  cols: plansza[0]?.length ?? 0,
});

export const SamePos = (a: Pos, b: Pos) => a.row == b.row && a.col == b.col;

export const Klucz  = (pos: Pos): string => `${pos.row},${pos.col}`;

export const PoleAt = (plansza:Board, pos: Pos): Maybe<Cell> =>
  Maybe.fromNullable(plansza[pos.row]?.[pos.col]);
export function AllPos(size: Size): Pos[] {  
  const arr: Pos[] = [];  
  for(let row = 0; row < size.rows; row++) {
    for(let col = 0; col < size.cols; col++) arr.push({ row, col });

  }
  return arr;
}

const Sasiedzi2 = Memoize(
  (wiersze: number, cols:number, row:number, col: number): ReadonlyArray<Pos> => { 
    const res: Pos[] = [];
    const gora = row - 1 >= 0;

    const dol = row + 1 < wiersze;
    const lewo  = col - 1 >= 0;
    const prawo = col + 1 < cols;
    if (gora && lewo) res.push({ row: row - 1, col: col - 1 });
	  if (gora) res.push({ row: row - 1, col: col });
    if(gora && prawo) res.push({ row: row - 1, col: col + 1 });
    if (lewo) res.push({ row: row, col: col - 1 });
    if (prawo) res.push({ row: row, col: col + 1 })   
	  if (dol && lewo) res.push({ row: row + 1,  col: col - 1 })
    if(dol) res.push({ row: row + 1,  col: col });
    if (dol && prawo) res.push({ row: row + 1, col: col + 1 });
    return res;
  },
  (wiersze, cols, row, col) => `${wiersze},${cols},${row},${col}`,
);

export const Neigbours = (size : Size, pos: Pos): ReadonlyArray<Pos> =>
  Sasiedzi2(size.rows, size.cols, pos.row, pos.col);

const MapRow = (row: ReadonlyArray<Cell>, fn: (pole: Cell,  col : number) => Cell) => {
  const zmapowane  = row.map(fn)
  return zmapowane.every((pole, col) => pole === row[col]) ? row : zmapowane
};

export const MapujPlansze = (fn: (pole: Cell, pos: Pos) => Cell, plansza: Board): Board => {
  const zmapowane = plansza.map((pola, row) => MapRow(pola, (pole, col) => fn(pole, { row, col })));

  return zmapowane.every((pola, row) => pola === plansza[row]) ? plansza : zmapowane
};
export const UpdateCells = (
  plansza: Board,
  pozycje: ReadonlyArray<Pos>,
  fn: (pole: Cell) => Cell,   
): Board => {
  const cele = new Set(pozycje.map(Klucz));
  const ruszoneWiersze = new Set(pozycje.map((pos) => pos.row));


  return plansza.map((pola,row) =>
    ruszoneWiersze.has(row)
      ? MapRow(pola, (pole, col) => (cele.has(Klucz({ row, col })) ? fn(pole) : pole))
      : pola,
  );
}; 

export function IleMinObok(plansza: Board, pos: Pos): number {  
  let cnt = 0;
  Neigbours(RozmiarOf(plansza), pos).forEach((n) => {
    if (plansza[n.row][n.col].mine) cnt = cnt + 1;
  });
  return cnt;
}
export const CountMarks = (znacznik: Mark, plansza:Board): number =>
	R.sum(plansza.map((pola) => pola.filter((pole) =>  pole.mark === znacznik).length));
