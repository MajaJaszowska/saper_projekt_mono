"use client";

import { ToggleGroup } from "radix-ui";
import { useEffect, useEffectEvent, useState } from "react";
import { getTime, losowySeed, useZegar } from "@/lib/client/czas";
import { PRESET_KEYS, NAZWY_POZIOMOW, jakiPreset, PRESETS } from "@/lib/core/config";
import { CONFIG_DNIA, seedDnia, seriaDzienna, czyGral, dzisKlucz } from "@/lib/core/daily";
import { czytajKod, zrobKod, type GameCode } from "@/lib/core/gameCode";
import { doRekordu } from "@/lib/core/record";
import { configDla } from "@/lib/core/settings";
import { rankOf } from "@/lib/core/statystyki";
import type { Config, Kind, Pos, PresetKey } from "@/lib/core/types";
import { ileMinZostalo } from "@/lib/core/ruchy";
import { startGry, czasGry, type GameEvent, gameReducer, type GameState } from "@/lib/reducers/gameReducer";
import { useApp, useDaneGry } from "./AppProvider";
import { Plansza } from "./board/Plansza";
import { CodePanel } from "./CodePanel";
import { CustomBoardDialog } from "./dialogs/CustomBoardDialog";
import { ResultDialog } from "./dialogs/ResultDialog";
import { Hud } from "./hud/Hud";
import { FlagIcon } from "./ui/icons";

export function Game() {
  const { boot, settings, dispatchSettings, addRecord, addDaily } = useApp();
  const { records, daily, isDemo } = useDaneGry();

  const [state, setState] = useState(() => {
    if (boot.code !== null) {
      const kod = czytajKod(boot.code).fold<GameCode | null>(
        () => null,
        (k) => k,
      );
      if (kod !== null) return startGry("code", kod.config, kod.seed, 0);
    }
    return startGry("normal", configDla(settings), boot.seed, 0);
  });
  const [wcisniety, setWcisniety] = useState(false);
  const [trybFlag, setTrybFlag] = useState(false);
  const [wynikZamkniety, setWynikZamkniety] = useState(false);
  const [notka, setNotka] = useState<string | null>(null);
  const [wlasnaOtwarta, setWlasnaOtwarta] = useState(false);
  const [dailyKey, setDailyKey] = useState<string | null>(null);
  const [ruchy2, setRuchy2] = useState(0);
  const now = useZegar(state.status === "playing");

  const koniec = state.status === "won" || state.status === "lost";

  const koniecGry = (gra: GameState) => {
    console.log("koniec gry", gra.status, gra);
    if (gra.kind === "daily") {
      if (dailyKey === null) return;
      if (isDemo) {
        setNotka("Tryb demonstracyjny: ten wynik nie został zapisany.");
        return;
      }
      if (czyGral(daily, dailyKey)) {
        setNotka("Dzisiejszy wynik planszy dnia jest juz zapisany. To była próba treningowa.");
        return;
      }

      const wynik = {
        dateKey: dailyKey,
        won: gra.status === "won",
        timeSec: czasGry(gra, gra.now),
      };
      addDaily(wynik);
      if (wynik.won) {
        setNotka(`Plansza dnia zaliczona! Seria: ${seriaDzienna([...daily, wynik], dailyKey)} dni.`);
      } else {
        setNotka("Plansza dnia zapisana. Jutro kolejna szansa.");
      }
    } else {
      if (gra.kind !== "normal" || gra.finishedAt === null) return;
      if (isDemo) {
        setNotka("Tryb demonstracyjny: ten wynik nie został zapisany.");
        return;
      }

      const rekord = doRekordu({
        kind: gra.kind,
        config: gra.config,
        seed: gra.seed,
        won: gra.status === "won",
        finishedAt: gra.finishedAt,
        timeSec: czasGry(gra, gra.now),
        clicks: gra.clicks,
        flagsUsed: gra.flagsUsed,
      });
      let tekst: string | null = null;
      if (rekord.won && rekord.presetKey !== "custom") {
        tekst = rankOf(rekord, [...records, rekord]).fold<string | null>(
          () => null,
          (rank) => (rank === 1 ? "Nowy rekord!" : `${rank}. miejsce w top 10`),
        );
      }
      setNotka(tekst);
      addRecord(rekord);
    }
  };

  const ruch = (event: GameEvent) => {
    const next = gameReducer(state, event);
    if (next === state) return;

    setState(next);
    setRuchy2(ruchy2 + 1);
    if (!koniec && (next.status === "won" || next.status === "lost")) koniecGry(next);
  };

  function start(rodzaj: Kind, config: Config, seed: number) {
    setWynikZamkniety(false);
    setNotka(null);
    setState(startGry(rodzaj, config, seed, getTime()));
  }

  const nowaGra = () => {
    console.log("nowa gra");
    start("normal", state.config, losowySeed());
  };

  const flaga = (pos: Pos) =>
    ruch({ type: "MARK", pos, now: getTime(), allowQuestion: settings.questionMarks });

  const lewyKlik = (pos: Pos) => {
    if (trybFlag) {
      ruch({ type: "MARK", pos, now: getTime(), allowQuestion: settings.questionMarks });
      return;
    }

    let odkryte = false;
    if (state.board !== null) odkryte = state.board[pos.row][pos.col].revealed;
    if (!odkryte) {
      ruch({ type: "REVEAL", pos, now: getTime() });
    } else {
      if (settings.chording) ruch({ type: "CHORD", pos, now: getTime() });
    }
  };

  const zmienPoziom = (preset: PresetKey) => {
    console.log("poziom:", preset);
    if (preset === "custom") return setWlasnaOtwarta(true);

    dispatchSettings({ type: "SET_LAST_PRESET", preset });
    start("normal", PRESETS[preset], losowySeed());
  };

  const grajWlasna = (config: Config) => {
    setWlasnaOtwarta(false);
    dispatchSettings({ type: "SET_LAST_PRESET", preset: "custom", customConfig: config });
    start("normal", config, losowySeed());
  };

  const planszaDnia = () => {
    const t = getTime();
    const key = dzisKlucz(t, -new Date(t).getTimezoneOffset());
    console.log(key);
    setDailyKey(key);
    start("daily", CONFIG_DNIA, seedDnia(key));
  };

  const restartR = useEffectEvent(nowaGra);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const cel = event.target as HTMLElement | null;
      const zajety = cel?.closest("input, textarea, select, [role='dialog']") != null;
      if (zajety || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "r" || event.key === "R") restartR();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const presetKey = jakiPreset(state.config);

  return (
    <div className="mx-auto flex w-full max-w-full flex-col items-center gap-4">
      <ToggleGroup.Root
        type="single"
        value={presetKey}
        onValueChange={(value) => {
          const preset = PRESET_KEYS.find((key) => key === value);
          if (preset !== undefined) zmienPoziom(preset);
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

      <button type="button" className="btn" onClick={planszaDnia}>
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
          <strong>{seriaDzienna(daily, dailyKey)} dni</strong>.
          {czyGral(daily, dailyKey) && " Dzisiejszy wynik jest już zapisany, grasz treningowo."}
        </p>
      )}

      <div className="card flex max-w-full flex-col items-center gap-3">
        <Hud
          minesLeft={ileMinZostalo(state.config, state.board)}
          seconds={czasGry(state, now)}
          status={state.status}
          pressed={wcisniety}
          iconSet={settings.iconSet}
          onReset={nowaGra}
        />
        <Plansza
          board={state.board}
          config={state.config}
          status={state.status}
          exploded={state.exploded}
          iconSet={settings.iconSet}
          onPrimary={lewyKlik}
          onMark={flaga}
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
        currentCode={state.kind === "code" ? zrobKod(state.config, state.seed) : null}
        onLoad={(kod) => start("code", kod.config, kod.seed)}
        onRandom={() => start("code", state.config, losowySeed())}
      />

      <CustomBoardDialog
        open={wlasnaOtwarta}
        onOpenChange={setWlasnaOtwarta}
        initial={settings.customConfig}
        onSubmit={grajWlasna}
      />

      <ResultDialog
        open={koniec && !wynikZamkniety}
        onOpenChange={(open) => setWynikZamkniety(!open)}
        won={state.status === "won"}
        iconSet={settings.iconSet}
        timeSec={czasGry(state, state.now)}
        levelLabel={NAZWY_POZIOMOW[presetKey]}
        clicks={state.clicks}
        note={notka}
        onNewGame={nowaGra}
        onSameBoard={
          state.kind === "normal" ? null : () => start(state.kind, state.config, state.seed)
        }
      />
    </div>
  );
}
