"use client";

import {usePathname} from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { GetTime, RandomSeed } from "@/lib/client/czas";
import {
  type Boot,
  WyczyscDemo,
  LoadAll,
  SaveDaily,
  SaveDemo,
  SaveRecords,
  ZapiszUstawienia,
} from "@/lib/client/storage";
import { useUstawienia } from "@/lib/client/useApplySettings";
import type { Backup } from "@/lib/core/backup";
import {DodajDaily, type DailyResult} from "@/lib/core/daily";
import {type DemoState, DemoData} from "@/lib/core/demo";
import {DopiszRekord, type GameRecord} from "@/lib/core/record";
import type { Settings } from "@/lib/core/settings";
import {type SettingsAction, UstawieniaReducer} from "@/lib/reducers/settingsReducer";


import { Nav } from "./Nav";
import { MockBoard, SzareLinie } from "./ui/MockBoard";

type App = {
  boot: Boot
  settings: Settings
  records: ReadonlyArray<GameRecord>;
  daily: ReadonlyArray<DailyResult>;
  demo: DemoState | null;
  addDaily: (wynik: DailyResult) => void;
  restoreBackup: (backup: Backup) => void;
  startDemo: (count: number) =>  void;
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
  const [settings,  setSettings] = useState(boot.settings);   
  const [realRecords, setRealRecords] = useState(boot.records);
  const [realDaily, setRealDaily] = useState(boot.daily);
  const [demo, setDemo] = useState<DemoState | null>(boot.demo);
  const [komunikaty, setKomunikaty] = useState(boot.warnings);   
  const rekordyDemo = useMemo(
    () => (demo === null ? null : DemoData(demo.seed, demo.count, demo.generatedAt)),
    [demo],
  );

  useUstawienia(settings);

  const ZapiszBlad = (blad: string | null) => {
    if(blad !== null) {
      setKomunikaty((obecny) => (obecny.includes(blad) ? obecny : [...obecny, blad]));
    }
  };

  const StopDemo = () => {
    setDemo(null);
      ZapiszBlad(WyczyscDemo());

  };

  const app: App = {
    boot,
    settings,
    records: rekordyDemo ?? realRecords,
    daily: demo === null ? realDaily : [],
    demo,
    startDemo: (count) => {
      const d = {
        seed: demo?.seed ?? RandomSeed(),
        count,
        generatedAt: demo?.generatedAt ?? GetTime(),
      };
      console.log("demo", d);
      setDemo(d);
      ZapiszBlad(SaveDemo(d));
      },
    rerollDemo: () => {
      if (demo === null) return;
      const d = { ...demo, seed: RandomSeed() };
      setDemo(d);
      ZapiszBlad(SaveDemo(d));
    },
    stopDemo: StopDemo,
    dispatchSettings: (action) => {
      const nowe = UstawieniaReducer(settings, action);
      setSettings(nowe);   
      ZapiszBlad(ZapiszUstawienia(nowe));

    },
    addRecord: (rekord) => {
      if (demo !== null) return;

      const lista = DopiszRekord(realRecords, rekord);
     setRealRecords(lista)
      ZapiszBlad(SaveRecords(lista));
    },
    clearRecords: () => {
      if (demo !== null) return;
      setRealRecords([])
      setRealDaily([]);
	    ZapiszBlad(SaveRecords([]));
      ZapiszBlad(SaveDaily([]));
    },
    addDaily: (wynik) => {
      if(demo !== null) return; 
      const lista = DodajDaily(realDaily, wynik);   
      setRealDaily(lista);
      ZapiszBlad(SaveDaily(lista));
    },
    restoreBackup: (backup) => {
      if (demo !== null) return;
      setSettings(backup.settings)
      setRealRecords(backup.records);
      setRealDaily(backup.daily);
      ZapiszBlad(ZapiszUstawienia(backup.settings));
      ZapiszBlad(SaveRecords(backup.records));
      ZapiszBlad(SaveDaily(backup.daily));
    },
  };

  return (
    <AppContext.Provider value={app}>
      {demo !== null && (
        <div className="demo-banner" role="status">
          <span>Tryb demonstracyjny: to nie są Twoje wyniki</span>
          <button type="button" className="btn" onClick={StopDemo}>
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
export function AppProvider({ children }: { children: ReactNode }){
  const pathname = usePathname();
  const [boot, setBoot] = useState<Boot | null>(null);
  const [blad, setBlad] = useState(false);


  const Wczytaj = () => {
    try {
      setBoot(LoadAll());
      setBlad(false);
    } catch {
      setBlad(true);
    }
  };


  useEffect(() => {
    let ok = true;
    Promise.resolve().then(() => {
      if (ok) Wczytaj();
    });
    return () => {



      ok = false;
    };
  }, []);


  if (blad) {
    return (
      <div className="card mx-auto max-w-md text-center" role="alert">
        <p className="font-semibold">Nie udało się wczytać danych aplikacji</p>
        <button type="button" className="btn btn-primary mt-3" onClick={Wczytaj}>
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
