import { PRESETS } from "./config";
import type { Config, PresetKey } from "./types";
export const MOTYWY = ["light", "dark", "system"] as const;
export const SKINS = ["violet-night", "neon", "pastel-dark", "modern", "classic", "contrast"] as const
export const ROZMIARY_POLA           = ["small", "medium", "large"] as const;
export const ICON_SETS = ["classic", "space", "garden", "minimal"] as const;
export const CELL_STYLES = ["flat","raised", "rounded"] as const;

export type Theme         = (typeof MOTYWY)[number];
 export type Skin=(typeof SKINS)[number];
export type CellSize=(typeof ROZMIARY_POLA)[number];
export type IconSet = (typeof ICON_SETS)[number];
export type CellStyle = (typeof CELL_STYLES)[number];
export type Settings = Readonly<{
  theme: Theme  
  skin:Skin
  accent: string;
  iconSet:IconSet;
  cellStyle: CellStyle;
 cellSize: CellSize;
  questionMarks : boolean;
 chording: boolean;
  animations: boolean;
  lastPreset: PresetKey;
  customConfig: Config;
}>; 
export const AKCENTY = [
  { name: "Fiolet", color: "#7c3aed" },
  { name: "Lawenda", color: "#a78bfa" },
 { name: "Indygo", color: "#4f46e5" }, 
  { name: "Magenta", color: "#c026d3" },
  { name: "Róż", color: "#db2777" },
  { name: "Turkus", color: "#0d9488" },
  { name: "Bursztyn", color: "#d97706" },   
] as const;
export const DOMYSLNE: Settings = {
  theme: "dark",
  skin: "violet-night",
    accent: AKCENTY[0].color,
  iconSet: "classic",
  cellStyle: "raised",
  cellSize: "medium",
  questionMarks: false,  
  chording: true,  
  animations: true,  
  lastPreset: "beginner",
  customConfig: { rows: 12, cols: 12, mines: 20 },   
};

export const NAZWY_MOTYWOW: Readonly<Record<Theme, string>> = {
  light: "Jasny",
  dark: "Ciemny",
   system: "Systemowy",
};
export const SKIN_LABELS: Readonly<Record<Skin, string>> = {
  "violet-night": "Fiolet noc",
  neon: "Neon",
  "pastel-dark": "Pastel ciemny",
  modern: "Nowoczesny",
  classic: "Klasyk",
  contrast: "Wysoki kontrast",
}; 

export const CELL_SIZE_LABELS : Readonly<Record<CellSize, string>> = {
  small: "Mały",
   medium: "Średni",
  large: "Duży",
}; 
export const ICON_SET_LABELS: Readonly<Record<IconSet, string>> = {
  classic: "Klasyczny",
  space: "Kosmos",
  garden: "Ogród",
   minimal: "Minimalny",
};

export const NAZWY_STYLOW_POLA:Readonly<Record<CellStyle, string>> = {
  flat: "Płaski",
  raised: "Wypukły",
  rounded: "Zaokrąglony",  
};

export const ConfigDla = (ustawienia:Settings): Config =>
  ustawienia.lastPreset === "custom" ? ustawienia.customConfig : PRESETS[ustawienia.lastPreset];

