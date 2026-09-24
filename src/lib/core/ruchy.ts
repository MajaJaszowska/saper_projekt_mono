import { neigbours, rozmiarOf, zmienPola, mapujPlansze, policzZnaczniki } from "./plansza";
import { odkryj } from "./reveal";
import type { Board, Cell, Config, Mark, Pos, RevealResult } from "./types";

export function czyWygrana(plansza: Board): boolean {
  for (const pola of plansza) {
    for (const pole of pola) {
      if (!pole.mine && !pole.revealed) return false;
    }
  }
  return true;
}

export const pokazMiny = (plansza: Board): Board =>
  mapujPlansze(
    (pole) =>
      pole.mine && pole.mark !== "flag" && !pole.revealed ? { ...pole, revealed: true } : pole,
    plansza,
  );

export const oflagujReszte = (plansza: Board): Board =>
  mapujPlansze((pole) => (pole.mine && pole.mark !== "flag" ? { ...pole, mark: "flag" } : pole), plansza);

export const zlaFlaga = (pole: Cell) => pole.mark === "flag" && !pole.mine;

export const ileMinZostalo = (config: Config, plansza: Board | null): number => {
  if (plansza === null) return config.mines;
  return config.mines - policzZnaczniki("flag", plansza);
};

function ileOdkrytych(plansza: Board) {
  let ile = 0;
  for (let i = 0; i < plansza.length; i++) {
    for (let j = 0; j < plansza[i].length; j++) {
      if (plansza[i][j].revealed) ile++;
    }
  }
  return ile;
}

export function zmienZnacznik(pytajniki: boolean, board: Board, pos: Pos): Board | null {
  const pole = board[pos.row]?.[pos.col];
  if (pole === undefined || pole.revealed) return null;

  return zmienPola(board, [pos], (p) => {
    let nowy: Mark = "none";
    if (p.mark === "none") nowy = "flag";
    else if (p.mark === "flag") {
      if (pytajniki) nowy = "question";
    }
    return { ...p, mark: nowy };
  });
}

export function chord(plansza: Board, pos: Pos): RevealResult | null {
  const pole = plansza[pos.row]?.[pos.col];
  if (pole === undefined) return null;
  if (!pole.revealed || pole.mine || pole.adjacent == 0) return null;

  const around = neigbours(rozmiarOf(plansza), pos);
  let flagi = 0;
  for (let i = 0; i < around.length; i++) {
    const n = around[i];
    if (plansza[n.row][n.col].mark === "flag") flagi++;
  }
  if (flagi !== pole.adjacent) return null;

  let res: RevealResult = { board: plansza, hitMine: false, exploded: null, order: [] };
  for (const sasiad of around) {
    const krok = odkryj(res.board, sasiad);
    res = {
      board: krok.board,
      hitMine: res.hitMine || krok.hitMine,
      exploded: res.exploded ?? krok.exploded,
      order: [...res.order, ...krok.order],
    };
  }
  return res;
}
