import { IleMinObok, NowaPlansza, MapujPlansze } from "./plansza";
import type { Board, Mark } from "./types";

export const PlanszaZAscii = (wiersze: ReadonlyArray<string>): Board => {
  const tmp = NowaPlansza(wiersze.length, wiersze[0].length, ({ row, col }) => {
    const znak = wiersze[row][col] ?? ".";
    let mark: Mark = "none";
    if(znak === "F" || znak === "f") mark = "flag";
    if(znak === "?") mark = "question";
    return {
      mine: znak === "*" || znak === "F" || znak === "X",
      adjacent: 0,
      revealed: znak === " " || znak === "X" || /\d/.test(znak),
     mark,
    };
  });

  return MapujPlansze((cell, pos) => ({ ...cell, adjacent: IleMinObok(tmp, pos) }), tmp);

};
