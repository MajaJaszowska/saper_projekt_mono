"use client";

import { usePathname } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { getTime, losowySeed } from "@/lib/client/czas";
import {
  type Boot,
  wyczyscDemo,
  wczytajWszystko,
  zapiszDaily,
  zapiszDemo,
  zapiszRekordy,
  zapiszUstawienia,
} from "@/lib/client/storage";
import { useUstawienia } from "@/lib/client/useApplySettings";
import type { Backup } from "@/lib/core/backup";
import { dodajDaily, type DailyResult } from "@/lib/core/daily";
import { type DemoState, daneDemo } from "@/lib/core/demo";
import { dopiszRekord, type GameRecord } from "@/lib/core/record";
import type { Settings } from "@/lib/core/settings";
import { type SettingsAction, ustawieniaReducer } from "@/lib/reducers/settingsReducer";
import { Nav } from "./Nav";
import { MockBoard, SzareLinie } from "./ui/MockBoard";

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

function AppState({ boot, children }: { boot: Boot; children: ReactNode }) {
  const [settings, setSettings] = useState(boot.settings);
  const [realRecords, setRealRecords] = useState(boot.records);
  const [realDaily, setRealDaily] = useState(boot.daily);
  const [demo, setDemo] = useState<DemoState | null>(boot.demo);
  const [komunikaty, setKomunikaty] = useState(boot.warnings);
  const rekordyDemo = useMemo(
    () => (demo === null ? null : daneDemo(demo.seed, demo.count, demo.generatedAt)),
    [demo],
  );

  useUstawienia(settings);

  const save = (blad: string | null) => {
    if (blad !== null) {
      setKomunikaty((obecny) => (obecny.includes(blad) ? obecny : [...obecny, blad]));
    }
  };

  const stopDemo = () => {
    setDemo(null);
    save(wyczyscDemo());
  };

  const app: App = {
    boot,
    settings,
    records: rekordyDemo ?? realRecords,
    daily: demo === null ? realDaily : [],
    demo,
    startDemo: (count) => {
      const d = {
        seed: demo?.seed ?? losowySeed(),
        count,
        generatedAt: demo?.generatedAt ?? getTime(),
      };
      console.log("demo", d);
      setDemo(d);
      save(zapiszDemo(d));
    },
    rerollDemo: () => {
      if (demo === null) return;
      const d = { ...demo, seed: losowySeed() };
      setDemo(d);
      save(zapiszDemo(d));
    },
    stopDemo,
    dispatchSettings: (action) => {
      const nowe = ustawieniaReducer(settings, action);
      setSettings(nowe);
      save(zapiszUstawienia(nowe));
    },
    addRecord: (rekord) => {
      if (demo !== null) return;
      const lista = dopiszRekord(realRecords, rekord);
      setRealRecords(lista);
      save(zapiszRekordy(lista));
    },
    clearRecords: () => {
      if (demo !== null) return;
      setRealRecords([]);
      setRealDaily([]);
      save(zapiszRekordy([]));
      save(zapiszDaily([]));
    },
    addDaily: (wynik) => {
      if (demo !== null) return;
      const lista = dodajDaily(realDaily, wynik);
      setRealDaily(lista);
      save(zapiszDaily(lista));
    },
    restoreBackup: (backup) => {
      if (demo !== null) return;
      setSettings(backup.settings);
      setRealRecords(backup.records);
      setRealDaily(backup.daily);
      save(zapiszUstawienia(backup.settings));
      save(zapiszRekordy(backup.records));
      save(zapiszDaily(backup.daily));
    },
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
