import { useState } from "react";


import type { IconSet } from "@/lib/core/settings";
import type { Status } from "@/lib/core/types"; 
import { FaceIcon, type Mood } from "../ui/icons";


type Props = {
  minesLeft: number;
  seconds: number;   
	status: Status;
  pressed: boolean;
  iconSet?: IconSet;

 onReset: () => void;
 };

function FormatDispaly(value: number): string {
  let x = value;
  if(x > 999) x  = 999;
 if(x < -99) x = -99;   
  if(x < 0) {
    return "-" + String(Math.abs(x)).padStart(2, "0");
   } 
  return String(x).padStart(3, "0");
}


 export function Hud({ minesLeft, seconds, status, pressed, iconSet, onReset }: Props) {
  let mood: Mood         = "play";
  if (pressed) mood = "press";
  if (status === "won") mood = "won";
   if(status == "lost") mood = "lost";

  return (
    <div className="hud">
      <div className="display" role="status" aria-label={`Pozostałe miny: ${minesLeft}`}>
        {FormatDispaly(minesLeft)}
      </div>
      <button type="button" className="face" onClick={onReset} aria-label="Nowa gra">
        <FaceIcon set={iconSet} mood={mood} />
      </button>
      <div className="display" role="timer" aria-label={`Czas: ${seconds} s`}>
        {FormatDispaly(seconds)}
      </div>
    </div>
  );
}
