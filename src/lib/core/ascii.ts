import { ileMinObok, nowaPlansza, mapujPlansze } from "./plansza";
import type { Board, Mark } from "./types";

export const planszaZAscii = (wiersze: ReadonlyArray<string>): Board => {
  const tmp = nowaPlansza(wiersze.length, wiersze[0].length, ({ row, col }) => {
    const znak = wiersze[row][col] ?? ".";
    let mark: Mark = "none";
    if (znak === "F" || znak === "f") mark = "flag";
    if (znak === "?") mark = "question";
    return {
      mine: znak === "*" || znak === "F" || znak === "X",
      adjacent: 0,
      revealed: znak === " " || znak === "X" || /\d/.test(znak),
      mark,
    };
  });

  return mapujPlansze((cell, pos) => ({ ...cell, adjacent: ileMinObok(tmp, pos) }), tmp);
};
