import type { Backup } from "../core/backup";
import { dodajDaily, type DailyResult } from "../core/daily";
import type { DemoState } from "../core/demo";
import { dopiszRekord, type GameRecord } from "../core/record";
import type { Settings } from "../core/settings";
import { type SettingsAction, ustawieniaReducer } from "./settingsReducer";

export type AppData = Readonly<{
  settings: Settings;
  records: ReadonlyArray<GameRecord>;
  daily: ReadonlyArray<DailyResult>;
  demo: DemoState | null;
}>;

const czyDemo = (stan: AppData) => stan.demo !== null;

export type AppAction =
  | Readonly<{ type: "SETTINGS"; action: SettingsAction }>
  | Readonly<{ type: "ADD_RECORD"; rekord: GameRecord }>
  | Readonly<{ type: "ADD_DAILY"; wynik: DailyResult }>
  | Readonly<{ type: "CLEAR_RECORDS" }>
  | Readonly<{ type: "RESTORE_BACKUP"; backup: Backup }>
  | Readonly<{ type: "START_DEMO"; count: number; seed: number; now: number }>
  | Readonly<{ type: "REROLL_DEMO"; seed: number }>
  | Readonly<{ type: "STOP_DEMO" }>;

// seed i czas podaje sie w akcji, bo inaczej sie psulo przy demo
export function appReducer(state: AppData, action: AppAction): AppData {
  switch (action.type) {
    case "SETTINGS": {
      const settings = ustawieniaReducer(state.settings, action.action);
      return settings === state.settings ? state : { ...state, settings };
    }
    case "START_DEMO":
      return {
        ...state,
        demo: {
          seed: state.demo?.seed ?? action.seed,
          count: action.count,
          generatedAt: state.demo?.generatedAt ?? action.now,
        },
      };
    case "REROLL_DEMO":
      return state.demo === null ? state : { ...state, demo: { ...state.demo, seed: action.seed } };
    case "STOP_DEMO":
      return state.demo === null ? state : { ...state, demo: null };
  }

  // w demo nie ruszamy prawdziwych danych!!
  if (state.demo !== null) return state;

  switch (action.type) {
    case "ADD_RECORD":
      return { ...state, records: dopiszRekord(state.records, action.rekord) };
    case "ADD_DAILY":
      return { ...state, daily: dodajDaily(state.daily, action.wynik) };
    case "CLEAR_RECORDS":
      return { ...state, records: [], daily: [] };
    case "RESTORE_BACKUP":
      return {
        ...state,
        settings: action.backup.settings,
        records: action.backup.records,
        daily: action.backup.daily,
      };
  }
}

export type Zapis =
  | Readonly<{ co: "settings"; settings: Settings }>
  | Readonly<{ co: "records"; records: ReadonlyArray<GameRecord> }>
  | Readonly<{ co: "daily"; daily: ReadonlyArray<DailyResult> }>
  | Readonly<{ co: "demo"; demo: DemoState }>
  | Readonly<{ co: "wyczyscDemo" }>;

// co trzeba zapisac do localStorage
export function planZapisu(przed: AppData, po: AppData): Zapis[] {
  const zapisy: Zapis[] = [];
  if (przed.settings !== po.settings) zapisy.push({ co: "settings", settings: po.settings });
  if (przed.records !== po.records) zapisy.push({ co: "records", records: po.records });
  if (przed.daily !== po.daily) zapisy.push({ co: "daily", daily: po.daily });
  if (przed.demo !== po.demo) {
    zapisy.push(po.demo === null ? { co: "wyczyscDemo" } : { co: "demo", demo: po.demo });
  }
  return zapisy;
}
