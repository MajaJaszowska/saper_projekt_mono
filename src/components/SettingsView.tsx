"use client";

import { Switch, ToggleGroup } from "radix-ui";
import { type ReactNode, useState } from "react";
import { PlanszaZAscii } from "@/lib/core/ascii";
import { IsKolorHex } from "@/lib/core/color";
import {
  AKCENTY,
    CELL_SIZE_LABELS,
  NAZWY_STYLOW_POLA,
  type CellSize,
  type CellStyle,
  ICON_SET_LABELS,  
  type IconSet,
  type Settings,
  SKIN_LABELS,   
  type Skin,
  type Theme,
  NAZWY_MOTYWOW,
} from "@/lib/core/settings";
import { ZlaFlaga } from "@/lib/core/ruchy";
import { useApp, useDaneGry } from "./AppProvider";
import { BackupPanel } from "./BackupPanel";
import {Pole} from "./board/Pole";
import {ConfirmDialog} from "./dialogs/ConfirmDialog";
import { FaceIcon, FlagIcon, MineIcon } from "./ui/icons";
type ChoiceProps<T extends string> = {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (value: T) => void;
  renderExtra?: (key: T) => ReactNode;
  disabled?: boolean;
};


function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
  renderExtra,
}: ChoiceProps<T>) {
  const klucze = Object.keys(options) as T[];
  const idEtykiety = `choice-${label.replace(/\s+/g, "-")}`;

  return (  
    <div className="flex flex-col gap-2">
      <span className="font-semibold" id={idEtykiety}>
        {label}
      </span>
      <ToggleGroup.Root
        type="single"
        value={value}
        aria-labelledby={idEtykiety}
        className="flex flex-wrap gap-2"
        onValueChange={(nastepny) => {

          const wybrany = klucze.find((key) => key === nastepny);
          if (wybrany !== undefined) onChange(wybrany);
        }}
      >
        {klucze.map((key) => (
          <ToggleGroup.Item key={key} value={key} className="btn">
            {renderExtra?.(key)}
            {options[key]}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
    );
} 

function Przelacznik(props: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const { id, label, hint, checked, onToggle } = props;
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="flex flex-col">
        <span className="font-semibold">{label}</span>
        <span className="text-muted text-sm">{hint}</span>
      </label>
     <Switch.Root id={id} className="switch" checked={checked} onCheckedChange={onToggle}>
        <Switch.Thumb className="switch-thumb" />
      </Switch.Root>
    </div>
  );
}

function WyborAkcentu({ value, onChange }: { value: string; onChange: (kolor: string) => void }) {
  let nazwa = "własny";
  for (let i = 0; i < AKCENTY.length; i++) {
    if (AKCENTY[i].color === value) nazwa  = AKCENTY[i].name;
  }
  return (
    <div className="flex flex-col gap-2">
      <span className="font-semibold" id="accent-label">
        Kolor akcentu
      </span>
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup.Root
          type="single"
          value={value}
          aria-labelledby="accent-label"
           className="flex flex-wrap gap-3"
          onValueChange={(nastepny) => {
            if (IsKolorHex(nastepny)) onChange(nastepny);
          }}
        >
          {AKCENTY.map((akcent) => (
            <ToggleGroup.Item
              key={akcent.color}
              value={akcent.color}
              className="accent-swatch"
              style={{ background: akcent.color }}
              aria-label={akcent.name}
              title={akcent.name}



            />
          ))}
        </ToggleGroup.Root>
        <label className="flex items-center gap-2 text-sm font-semibold">
          Własny
          <input
            type="color"
            className="h-10 w-12"
            style={{ cursor: "pointer" }}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
      </div>
      <p className="text-muted text-sm">
        Wybrany: {nazwa} ({value}).
        Jeśli kolor jest za jasny albo za ciemny, aplikacja sama go lekko skoryguje, żeby tekst był
        czytelny.
      </p>
    </div>
  );
}

const PREVIEW_BOARD = PlanszaZAscii(["  1F1.", " 12?2.", " 1X21f", " 111 ."]);

function Podglad({ settings }: { settings: Settings }) {
  return (
    <div className="flex flex-col gap-2">
       <span className="font-semibold">Podgląd</span>
      <div className="flex flex-wrap items-center gap-4" aria-hidden="true" inert>
        <div className="board" data-status="lost" style={{ margin: 0 }}>
          {PREVIEW_BOARD.map((cells, row) => (
            <div className="board-row" key={row} style={{ ["--cols" as string]: cells.length }}>
              {cells.map((cell, col) => (
                <Pole
                  key={col}
                  cell={cell}
                  row={row}
                  col={col}
                  tabbable={false}
                  exploded={row === 2 && col === 2}
                  wrongFlag={ZlaFlaga(cell)}
                  iconSet={settings.iconSet}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {(["play", "press", "won", "lost"] as const).map((mood) => (
            <span key={mood} className="face" style={{ cursor: "default" }}>
              <FaceIcon set={settings.iconSet} mood={mood} />
            </span>
          ))}
        </div>
        <span className="btn btn-primary">Przycisk</span>
      </div>
    </div>
  );
}

export function SettingsView() {
  const { settings, dispatchSettings, clearRecords } = useApp();
   const { records, isDemo } = useDaneGry();
  const [zapisano, setZapisano] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-col gap-4" aria-labelledby="look-title">
        <h2 id="look-title" className="text-lg font-bold">
          Wygląd
        </h2>
        <Podglad settings={settings} />
        <WyborAkcentu
          value={settings.accent}
	        onChange={(akcent) => dispatchSettings({ type: "SET_ACCENT", accent: akcent })}
        />
        <Choice<Theme>
          label="Tryb strony"
          value={settings.theme}

          options={NAZWY_MOTYWOW}
          onChange={(theme) => dispatchSettings({ type: "SET_THEME", theme })}
        />
        <Choice<Skin>   
          label="Motyw planszy"
          value={settings.skin}
          options={SKIN_LABELS}
          onChange={(skorka) => dispatchSettings({ type: "SET_SKIN", skin: skorka })}
        />
        <Choice<IconSet>
          label="Zestaw ikon"
          value={settings.iconSet}
          options={ICON_SET_LABELS}
	        onChange={(iconSet) => dispatchSettings({ type: "SET_ICON_SET", iconSet })}
           renderExtra={(set) => (
            <span className="flex items-center gap-0.5" aria-hidden="true">
              <FlagIcon set={set} className="inline-icon" />
              <MineIcon set={set} className="inline-icon" />
            </span>
          )}
        />
        <Choice<CellStyle>
          label="Styl pól"
          value={settings.cellStyle}
          options={NAZWY_STYLOW_POLA}
          onChange={(cellStyle) => dispatchSettings({ type: "SET_CELL_STYLE", cellStyle })}
        />
        <Choice<CellSize>
          label="Rozmiar pól"
          value={settings.cellSize}
          options={CELL_SIZE_LABELS}
          onChange={(cellSize) => dispatchSettings({ type: "SET_CELL_SIZE", cellSize })}
        />
      </section>

      <section className="card flex flex-col gap-4" aria-labelledby="play-title">
         <h2 id="play-title" className="text-lg font-bold">
         Rozgrywka
        </h2>
        <Przelacznik
          id="question-marks"
          label="Znaki zapytania"
          hint="Drugie oznaczenie pola zamienia flagę w znak zapytania."
          checked={settings.questionMarks}
          onToggle={() => dispatchSettings({ type: "TOGGLE_QUESTION_MARKS" })}
        />
        <Przelacznik
          id="chording"
           label="Chording"
          hint="Klik na odkrytą liczbę odkrywa sąsiadów , gdy flagi się zgadzają."   
          checked={settings.chording}
            onToggle={() => dispatchSettings({ type: "TOGGLE_CHORDING" })}
        />
        <Przelacznik
          id="animations"
          label="Animacje"
          hint="Zawsze wyłączone, gdy system prosi o ograniczenie ruchu."
          checked={settings.animations}
          onToggle={() => dispatchSettings({ type: "TOGGLE_ANIMATIONS" })}
        />
      </section>

      <section className="card flex flex-col gap-3" aria-labelledby="data-title">
        <h2 id="data-title" className="text-lg font-bold">
          Dane
        </h2>
         <p className="text-muted text-sm">
          {isDemo ? (
            "Tryb demonstracyjny jest włączony. Wróć do swoich danych, żeby zarządzać wynikami."
          ) : (
            <>
              Wyniki i ustawienia są zapisane tylko w tej przeglądarce. Zapisanych wyników:{" "}
              <strong>{records.length}</strong>.
            </>
          )}
        </p>
        <h3 className="font-semibold">Kopia zapasowa</h3>
        <BackupPanel />
        <h3 className="font-semibold">Porządki</h3>
        <div className="flex flex-wrap gap-2">
          <ConfirmDialog
            trigger="Przywróć domyślne"
            title="Przywrócić ustawienia domyślne?"
            steps={[
              "Kolor akcentu, motyw, ikony i pozostałe ustawienia wróca do wartości początkowych. Wyniki zostaną.",
            ]}
            confirmLabel="Przywróć"
            onConfirm={() => {
              console.log("reset ustawien");
              dispatchSettings({ type: "RESET" });
            }}   
          />
          {!isDemo && (
            <ConfirmDialog
              trigger="Usuń wszystkie wyniki"
              title="Usunąć wszystkie wyniki?"
              steps={[
                "Znikną wszystkie rekordy, statystyki i wyniki planszy dnia zapisane w tej przeglądarce.",
                "Napewno? Tej operacji nie da się cofnąć.",
              ]}
              confirmLabel="Tak, usuń wszystko"
              onConfirm={clearRecords}
            />
          )}
        </div>
      </section>
    </div>
  );
}
