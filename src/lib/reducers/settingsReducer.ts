import { IsKolorHex } from "../core/color";
import {
  type CellSize,
  type CellStyle,
  DOMYSLNE, 
  type IconSet,
  type Settings,
  type Skin,
  type Theme,
} from "../core/settings"
import type { Config, PresetKey } from "../core/types";
export type SettingsAction =
  | Readonly<{ type: "SET_THEME"; theme: Theme }>
  | Readonly<{ type: "SET_SKIN"; skin: Skin }>
  | Readonly<{ type: "SET_ACCENT"; accent: string }>
  | Readonly<{ type: "SET_ICON_SET"; iconSet: IconSet }>
   | Readonly<{ type: "SET_CELL_STYLE"; cellStyle: CellStyle }>
	| Readonly<{ type: "SET_CELL_SIZE"; cellSize: CellSize }>
  | Readonly<{ type: "TOGGLE_QUESTION_MARKS" }>
  | Readonly<{ type: "TOGGLE_CHORDING" }>
  | Readonly<{ type: "TOGGLE_ANIMATIONS" }>
  | Readonly<{ type: "SET_LAST_PRESET"; preset: PresetKey; customConfig?: Config }>
  | Readonly<{ type: "RESET" }>

export const UstawieniaReducer = (state: Settings, action: SettingsAction): Settings => {
  switch(action.type) {
    case "SET_THEME":
      return { ...state, theme: action.theme };


    case "SET_SKIN":
      return { ...state, skin: action.skin };
    case "SET_ACCENT":
      return IsKolorHex(action.accent) ? { ...state, accent: action.accent.toLowerCase() } : state;
    case "SET_ICON_SET":
      return { ...state, iconSet: action.iconSet };
    case "SET_CELL_STYLE":
      return { ...state, cellStyle: action.cellStyle };
    case "SET_CELL_SIZE":
      return { ...state, cellSize: action.cellSize };
   case "TOGGLE_QUESTION_MARKS":
      return { ...state, questionMarks: !state.questionMarks };
    case "TOGGLE_CHORDING":
      return { ...state, chording: !state.chording };
    case "TOGGLE_ANIMATIONS":
      return { ...state, animations: !state.animations };
    case "SET_LAST_PRESET":
      return {
        ...state,
        lastPreset: action.preset,
        customConfig: action.customConfig ?? state.customConfig,
        };
    case "RESET":
      return DOMYSLNE;
  }
 };