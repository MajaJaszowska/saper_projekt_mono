import { memo, type CSSProperties } from "react";
 import type { IconSet } from "@/lib/core/settings";
import type { Cell as CellData } from "@/lib/core/types";
import {CrossIcon, FlagIcon, MineIcon} from "../ui/icons";
type Props = { 
  cell: CellData;
  row: number
  col: number;
  tabbable: boolean;
  exploded: boolean;
  wrongFlag: boolean;

  iconSet: IconSet;   
};

export function OpisPola(pole: CellData, row: number, col: number, wrongFlag = false): string {
  let stan = "";
  if (wrongFlag) stan = "błędna flaga";
  else if (!pole.revealed) {
    if (pole.mark === "flag") stan = "flaga"
    else if (pole.mark === "question") stan = "znak zapytania";
    else stan = "ukryte";
   } else if (pole.mine) stan = "mina";  
  else if (pole.adjacent === 0) stan = "puste";
  else if(pole.adjacent === 1) stan = "1 sąsiednia mina";
  else if (pole.adjacent <= 4) stan = pole.adjacent + " sąsiednie miny";
  else stan = `${pole.adjacent} sąsiednich min`;


  return `Wiersz ${row + 1}, kolumna ${col + 1}, ${stan}`;  
}

function Zawartosc(pole: CellData, wrongFlag: boolean, set: IconSet) {
  if (wrongFlag) {   
    return (
      <> 
        <FlagIcon set={set} />
        <CrossIcon /> 
      </> 
    );
  }
  if (!pole.revealed){  
    if (pole.mark === "flag") return <FlagIcon set={set} />;
    return pole.mark === "question" ? "?" : null;
  }
  if (pole.mine) return <MineIcon set={set} />;
  return pole.adjacent > 0 ? pole.adjacent : null;
}
function PoleView({ cell, row, col, tabbable, exploded, wrongFlag, iconSet }: Props) {
  let klasy = "cell"
  if (cell.revealed) klasy += " cell-revealed";   
  else klasy += " cell-hidden";
  if(cell.revealed && !cell.mine && cell.adjacent > 0) klasy += ` cell-n${cell.adjacent}`;
  if (cell.mark === "flag" && !cell.revealed) klasy = klasy + " cell-flag"
  if (exploded) klasy += " cell-exploded";
  if (wrongFlag) klasy += " cell-wrong";
  return (
    <button
        type="button" 
      role="gridcell"
      className={klasy}
      style={{ "--r": row, "--c": col } as CSSProperties}
      data-row={row} 
      data-col={col}
      tabIndex={tabbable ? 0 : -1}   
      aria-label={OpisPola(cell, row, col, wrongFlag)} 
    >
      {Zawartosc(cell, wrongFlag, iconSet)}
    </button>
   );   

}

export const Pole = memo(PoleView);

