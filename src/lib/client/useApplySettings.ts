"use client";
import {useEffect} from "react";
import { KoloryAkcentu } from "../core/color"
import type { Settings } from "../core/settings";

export function useUstawienia(ustawienia: Settings) { 
  const { theme, skin, cellSize, cellStyle, animations, accent } = ustawienia;
  useEffect(() => { 
    const root   = document.documentElement;
    const ciemny = window.matchMedia("(prefers-color-scheme: dark)");

    const UstawMotyw = () => {
       let tryb: "dark" | "light" = "light";
      if(theme === "system") {
        if (ciemny.matches) tryb =  "dark";
      } else {
        tryb = theme;
      }
      const colors = KoloryAkcentu(accent, tryb);
      root.dataset.theme = tryb;
      root.style.setProperty("--accent", colors.accent);
      root.style.setProperty("--accent-text", colors.accentText);
      root.style.setProperty("--series-1", colors.chartWin);
      root.style.setProperty("--series-2", colors.chartLoss);
    }

    UstawMotyw();
	  root.dataset.skin = skin;

    root.dataset.cellSize =  cellSize;  

    root.dataset.cellStyle = cellStyle;
    root.dataset.animations = animations ? "on" : "off";

    ciemny.addEventListener("change", UstawMotyw);
     return () => ciemny.removeEventListener("change", UstawMotyw);
  }, [theme, skin, cellSize, cellStyle, animations, accent]);
}
