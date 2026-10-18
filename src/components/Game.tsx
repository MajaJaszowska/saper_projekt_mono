"use client";

import { ToggleGroup } from "radix-ui";
import { useEffect, useEffectEvent, useState } from "react";
import { GetTime, RandomSeed, useZegar } from "@/lib/client/czas";
import { PRESET_KEYS, NAZWY_POZIOMOW, JakiPreset, PRESETS } from "@/lib/core/config";
import { CONFIG_DNIA, SeedDnia, SeriaDzienna, AlreadyPlayed, DzisKlucz } from "@/lib/core/daily";
import { CzytajKod, MakeCode, type GameCode } from "@/lib/core/gameCode";  
 import { ToRecord } from "@/lib/core/record";
import { ConfigDla } from "@/lib/core/settings";  
import {RankOf} from "@/lib/core/statystyki";
import type { Board, Config, Kind, Pos, PresetKey } from "@/lib/core/types";
import { IleMinZostalo } from "@/lib/core/ruchy";
import {StartGry, CzasGry, type GameEvent, GameReducer, type GameState} from "@/lib/reducers/gameReducer";
import { useApp, useDaneGry } from "./AppProvider";
import {Plansza} from "./board/Plansza";
import { CodePanel } from "./CodePanel";
import { CustomBoardDialog } from "./dialogs/CustomBoardDialog";

import { ResultDialog } from "./dialogs/ResultDialog";
import { Hud } from "./hud/Hud";
import { FlagIcon } from "./ui/icons";

function PokazPlansze(plansza: Board | null) {
  if (plansza == null) return;
  console.log(plansza.map((w) => w.map((p) => (p.mine ? "*" : p.adjacent)).join(" ")).join("\n"));
}

export function Game() {
  const { boot, settings, dispatchSettings, addRecord, addDaily } = useApp();
  const { records, daily, isDemo } = useDaneGry();

  const [state, setState] = useState(() => {
    if (boot.code !== null) {
      const kod = CzytajKod(boot.code).fold<GameCode | null>(
        () => null,
        (k) => k,
      );
      if (kod !== null) return StartGry("code", kod.config, kod.seed, 0);
    }
    return StartGry("normal", ConfigDla(settings), boot.seed, 0);
  });
  const [wcisniety, setWcisniety] = useState(false);
  const [trybFlag, setTrybFlag] = useState(false);
  const [wynikZamkniety, setWynikZamkniety] = useState(false);
  const [notka,  setNotka] = useState<string | null>(null);
   const [wlasnaOtwarta, setWlasnaOtwarta] = useState(false);
  const [dailyKey, setDailyKey] = useState<string | null>(null);
  const [ruchy2, setRuchy2] = useState(0);
  const now    = useZegar(state.status === "playing");
  const koniec = state.status === "won" || state.status === "lost";

  const KoniecGry = (gra: GameState) => {
    console.log("koniec gry",gra.status, gra);
    if (gra.kind === "daily") {
      if(dailyKey === null) return;
      if (isDemo) {   
        setNotka("Tryb demonstracyjny: ten wynik nie został zapisany.");
        return;
      }
      if (AlreadyPlayed(daily, dailyKey)) {
        setNotka("Dzisiejszy wynik planszy dnia jest juz zapisany. To była próba treningowa.");
        return;
      }

      const wynik = {
        dateKey: dailyKey,
        won: gra.status === "won",
        timeSec: CzasGry(gra, gra.now),
      };
      addDaily(wynik);
      if(wynik.won) {
        setNotka(`Plansza dnia zaliczona! Seria: ${SeriaDzienna([...daily, wynik], dailyKey)} dni.`);
      } else {
        setNotka("Plansza dnia zapisana. Jutro kolejna szansa."); 
      }
    } else {
      if(gra.kind !== "normal" || gra.finishedAt === null) return
      if (isDemo) {
        setNotka("Tryb demonstracyjny: ten wynik nie został zapisany.");
        return;
      } 

      const rekord = ToRecord({
        kind: gra.kind,
        config: gra.config,
        seed: gra.seed,
        won: gra.status === "won",
        finishedAt: gra.finishedAt,
        timeSec: CzasGry(gra, gra.now),
        clicks: gra.clicks,
        flagsUsed: gra.flagsUsed,
      });
      let tekst: string | null = null
      if (rekord.won && rekord.presetKey !== "custom") {
        tekst = RankOf(rekord, [...records, rekord]).fold<string | null>(
          () => null,
          (rank) => (rank === 1 ? "Nowy rekord!" : `${rank}. miejsce w top 10`),
        );
      }
      setNotka(tekst);
      addRecord(rekord);
    }
  };

  const DoMove = (event: GameEvent) =>  {
    const next  = GameReducer(state, event);
    if (next === state) return;  
    // PokazPlansze(next.board)

    setState(next);
    setRuchy2(ruchy2 + 1);
    if (!koniec && (next.status === "won" || next.status === "lost")) KoniecGry(next);
  };

  function Start(rodzaj:Kind, config: Config, seed: number) {
    setWynikZamkniety(false);
    setNotka(null);
    setState(StartGry(rodzaj, config, seed, GetTime()));
  }

  const NowaGra = () => {
    console.log("nowa gra");
    Start("normal", state.config, RandomSeed());   
  };

  const PostawFlage = (pos: Pos) =>
    DoMove({ type: "MARK", pos, now: GetTime(), allowQuestion: settings.questionMarks });

  const LewyKlik = (pos: Pos) => {
    if (trybFlag) {
      DoMove({ type: "MARK", pos, now: GetTime(), allowQuestion: settings.questionMarks });
      return;
    }

    let odkryte = false;
    if (state.board !== null) odkryte = state.board[pos.row][pos.col].revealed;
    if (!odkryte) {
      DoMove({ type: "REVEAL", pos, now: GetTime() });
    } else {
      if (settings.chording) DoMove({ type: "CHORD", pos, now: GetTime() });
    }
  };

  const ZmienPoziom = (preset: PresetKey) => {
    console.log("poziom:", preset);
    if (preset === "custom") return setWlasnaOtwarta(true);

    dispatchSettings({ type: "SET_LAST_PRESET", preset });
    Start("normal", PRESETS[preset], RandomSeed());
  };
  const GrajWlasna = (config: Config) => {
    setWlasnaOtwarta(false);
    dispatchSettings({ type: "SET_LAST_PRESET", preset: "custom", customConfig: config });
    Start("normal", config, RandomSeed());  
  };
  const GrajDzienna = () => {
    const t   = GetTime();
    const key = DzisKlucz(t, -new Date(t).getTimezoneOffset());



    console.log(key);
    setDailyKey(key);
    Start("daily", CONFIG_DNIA, SeedDnia(key));
  };

  const RestartR = useEffectEvent(NowaGra)
  useEffect(() => {
    const OnKey = (event: KeyboardEvent) => { 
      const cel = event.target as HTMLElement | null;
      const zajety = cel?.closest("input, textarea, select, [role='dialog']") != null;
      if (zajety || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "r" || event.key === "R") RestartR();
    };
    window.addEventListener("keydown", OnKey)
    return () => window.removeEventListener("keydown", OnKey);
  }, []);

  const presetKey = JakiPreset(state.config);
  return (
    <div className="mx-auto flex w-full max-w-full flex-col items-center gap-4">
      <ToggleGroup.Root
        type="single"
        value={presetKey}
       onValueChange={(value) => {
          const preset = PRESET_KEYS.find((key) => key === value);
          if (preset !== undefined) ZmienPoziom(preset);  
          else if (presetKey === "custom") setWlasnaOtwarta(true);
        }}
        aria-label="Poziom trudności"
        className="flex flex-wrap justify-center gap-2"
      >
        {PRESET_KEYS.map((key) => (
          <ToggleGroup.Item key={key} value={key} className="btn">
            {NAZWY_POZIOMOW[key]}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>

      <button type="button" className="btn" onClick={GrajDzienna}>
        Plansza dnia
      </button>

      {state.kind === "code" && (
        <p className="card border-accent py-2 text-center text-sm" role="note">
          Plansza z kodu: wynik nie trafia do rekordów.
        </p>
      )}
      {state.kind === "daily" && dailyKey !== null && (
        <p className="card border-accent py-2 text-center text-sm" role="note">
          Plansza dnia {dailyKey}: taka sama u wszystkich. Twoja seria:{" "}   
          <strong>{SeriaDzienna(daily, dailyKey)} dni</strong>.
          {AlreadyPlayed(daily, dailyKey) && " Dzisiejszy wynik jest już zapisany, grasz treningowo."}
        </p>
      )}

      <div className="card flex max-w-full flex-col items-center gap-3">
        <Hud
          minesLeft={IleMinZostalo(state.config, state.board)}
          seconds={CzasGry(state, now)}
          status={state.status}
          pressed={wcisniety}
          iconSet={settings.iconSet}
          onReset={NowaGra} 
        />
        <Plansza
          board={state.board}
          config={state.config}
          status={state.status}
          exploded={state.exploded}
          iconSet={settings.iconSet}
          onPrimary={LewyKlik} 
          onMark={PostawFlage}
          onPressChange={setWcisniety}
        />
      </div>

      <ToggleGroup.Root
        type="single"
        value={trybFlag ? "mark" : "reveal"}
        onValueChange={(value) => {
          if (value !== "") setTrybFlag(value === "mark");
         }}
        aria-label="Co robi dotknięcie pola"
        className="flex gap-2"
      >
        <ToggleGroup.Item value="reveal" className="btn">
          Odkrywaj
        </ToggleGroup.Item>
        <ToggleGroup.Item value="mark" className="btn">
          <FlagIcon set={settings.iconSet} className="inline-icon" /> Oznaczaj
        </ToggleGroup.Item>
      </ToggleGroup.Root>

      <p className="text-muted max-w-prose text-center text-sm">
        Lewy przycisk odkrywa, prawy stawia flagę, klik na odkrytą liczbę odkrywa sąsiadów. Na
        telefonie przytrzymaj pole, żeby je oznaczyć. Klawiatura: strzałki, spacja lub Enter
        (odkryj), F (flaga), R (nowa gra).
      </p>

      <CodePanel
        currentCode={state.kind === "code" ? MakeCode(state.config, state.seed) : null}
        onLoad={(kod) => Start("code", kod.config, kod.seed)}
        onRandom={() => Start("code", state.config, RandomSeed())}
      />

      <CustomBoardDialog
        open={wlasnaOtwarta}
        onOpenChange={setWlasnaOtwarta}
        initial={settings.customConfig}
        onSubmit={GrajWlasna}
      />

      <ResultDialog
	      open={koniec && !wynikZamkniety}
        onOpenChange={(open) => setWynikZamkniety(!open)}
        won={state.status === "won"}
        iconSet={settings.iconSet}
        timeSec={CzasGry(state, state.now)}
        levelLabel={NAZWY_POZIOMOW[presetKey]}
        clicks={state.clicks}
        note={notka}
          onNewGame={NowaGra}
        onSameBoard={
          state.kind === "normal" ? null : () => Start(state.kind, state.config, state.seed)
        }



      />
    </div>
  );
}
