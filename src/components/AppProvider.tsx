"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { getTime, losowySeed } from "@/lib/client/czas";
import { type Boot, wczytajWszystko, wykonajZapis } from "@/lib/client/storage";
import { useUstawienia } from "@/lib/client/useApplySettings";
import type { Backup } from "@/lib/core/backup";
import type { DailyResult } from "@/lib/core/daily";
import { type DemoState, daneDemo } from "@/lib/core/demo";
import type { GameRecord } from "@/lib/core/record";
import type { Settings } from "@/lib/core/settings";
import { type AppData, appReducer, planZapisu } from "@/lib/reducers/reducerOdWszystkiego";
import type { SettingsAction } from "@/lib/reducers/settingsReducer";
import { Nav } from "./Nav";
import { MockBoard, SzareLinie } from "./ui/FejkowaPlansza";

type App = {
  boot: Boot;
  settings: Settings;
  records: ReadonlyArray<GameRecord>;
  daily: ReadonlyArray<DailyResult>;
  demo: DemoState | null;
  addDaily: (wynik: DailyResult) => void;
  restoreBackup: (backup: Backup) => void;
  startDemo: (count: number) => void;
  rerollDemo: () => void;
  stopDemo: () => void;
  dispatchSettings: (action: SettingsAction) => void;
  addRecord: (rekord: GameRecord) => void;
  clearRecords: () => void;
};

const AppContext = createContext<App | null>(null);

export const useApp = (): App => {
  const app = useContext(AppContext);
  if (app === null) throw new Error("brak AppProvider");
  return app;
};

export const useApp2 = () => useContext(AppContext);

export function useDaneGry() {
  const { records, daily, demo, boot } = useApp();
  let now = boot.now;
  if (demo !== null) now = demo.generatedAt;
  return { records, daily, isDemo: demo !== null, now };
}

const dodajKomunikat = (obecne: string[], blad: string) =>
  obecne.includes(blad) ? obecne : [...obecne, blad];

// zapisuje jak cos sie zmieni
function useZapisDoStorage(stan: AppData, onBlad: (blad: string) => void) {
  const poprzedni = useRef(stan);
  useEffect(() => {
    const zapisy = planZapisu(poprzedni.current, stan);
    poprzedni.current = stan;
    for (const zapis of zapisy) {
      const blad = wykonajZapis(zapis);
      if (blad !== null) onBlad(blad);
    }
  }, [stan, onBlad]);
}

function AppState({ boot, children }: { boot: Boot; children: ReactNode }) {
  const [stan, dispatch] = useReducer(appReducer, {
    settings: boot.settings,
    records: boot.records,
    daily: boot.daily,
    demo: boot.demo,
  });
  const [komunikaty, setKomunikaty] = useState(boot.warnings);
  const { settings, demo } = stan;
  const rekordyDemo = useMemo(
    () => (demo === null ? null : daneDemo(demo.seed, demo.count, demo.generatedAt)),
    [demo],
  );

  useUstawienia(settings);

  const pokazBlad = useCallback(
    (blad: string) => setKomunikaty((obecne) => dodajKomunikat(obecne, blad)),
    [],
  );
  useZapisDoStorage(stan, pokazBlad);

  const stopDemo = () => dispatch({ type: "STOP_DEMO" });

  const app: App = {
    boot,
    settings,
    records: rekordyDemo ?? stan.records,
    daily: demo === null ? stan.daily : [],
    demo,
    startDemo: (count) => {
      console.log("demo", count);
      dispatch({ type: "START_DEMO", count, seed: losowySeed(), now: getTime() });
    },
    rerollDemo: () => dispatch({ type: "REROLL_DEMO", seed: losowySeed() }),
    stopDemo,
    dispatchSettings: (action) => dispatch({ type: "SETTINGS", action }),
    addRecord: (rekord) => dispatch({ type: "ADD_RECORD", rekord }),
    clearRecords: () => dispatch({ type: "CLEAR_RECORDS" }),
    addDaily: (wynik) => dispatch({ type: "ADD_DAILY", wynik }),
    restoreBackup: (backup) => dispatch({ type: "RESTORE_BACKUP", backup }),
  };

  return (
    <AppContext.Provider value={app}>
      {demo !== null && (
        <div className="demo-banner" role="status">
          <span>Tryb demonstracyjny: to nie są Twoje wyniki</span>
          <button type="button" className="btn" onClick={stopDemo}>
            Wróć do moich danych
          </button>
        </div>
      )}
      <Nav />
      {komunikaty.length > 0 && (
        <div className="mx-auto mt-3 flex w-full max-w-3xl flex-col gap-2 px-4" role="alert">
          {komunikaty.map((komunikat) => (
            <p key={komunikat} className="card border-danger flex items-center justify-between gap-3">
              <span>{komunikat}</span>
              <button
                type="button"
                className="btn"
                onClick={() => setKomunikaty((obecny) => obecny.filter((x) => x !== komunikat))}
              >
                Zamknij
              </button>
            </p>
          ))}
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [boot, setBoot] = useState<Boot | null>(null);
  const [blad, setBlad] = useState(false);

  const wczytaj = () => {
    try {
      setBoot(wczytajWszystko());
      setBlad(false);
    } catch {
      setBlad(true);
    }
  };

  useEffect(() => {
    let ok = true;
    Promise.resolve().then(() => {
      if (ok) wczytaj();
    });
    return () => {
      ok = false;
    };
  }, []);

  if (blad) {
    return (
      <div className="card mx-auto max-w-md text-center" role="alert">
        <p className="font-semibold">Nie udało się wczytać danych aplikacji</p>
        <button type="button" className="btn btn-primary mt-3" onClick={wczytaj}>
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (boot === null) {
    return (
      <>
        <Nav />
        <main className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 p-4">
          {pathname.replace(/\/$/, "") === "" ? <MockBoard /> : <SzareLinie lines={6} />}
        </main>
      </>
    );
  }

  return <AppState boot={boot}>{children}</AppState>;
}
