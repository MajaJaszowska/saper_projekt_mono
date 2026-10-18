"use client"; 

import Link from "next/link";

import { Tabs, ToggleGroup } from "radix-ui";
import {useEffect, useState} from "react";
import { PRESET_KEYS, NAZWY_POZIOMOW } from "@/lib/core/config";
import type { GameRecord } from "@/lib/core/record";
import {
  DniAktywnosci,
  Agreguj,
  SredniCzas,
  Top10,
  FiltrPoziom,
  FilterDays,
  FormatTime,
   WinRate,
  Streaks,
  OstatnieGry,
  Procent,
  WinsPerPreset,
} from "@/lib/core/statystyki";
import type { PresetKey } from "@/lib/core/types";
import { useDaneGry } from "../AppProvider";
import { BarChart } from "./BarChart";
import {DataTable} from "./DataTable";
 import { DemoPanel } from "./DemoPanel";
import { Heatmap } from "./Heatmap";
import { LineChart } from "./LineChart";

type Filter = PresetKey | "all";

const ZAKRESY = [
  { key: "7", label: "7 dni", days: 7 },
  { key: "30", label: "30 dni", days: 30 },
  { key: "all", label: "Wszystko", days: null },
] as const;

const TYGODNIE = 12;
const WEEKDAY_NAMES = ["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"];

const FormatujDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });

const FormatDayKey = (dayKey: string): string =>
  new Date(`${dayKey}T00:00:00Z`).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

function KartaStat({ label, value }: { label:string; value: string }) {
  return (
    <div className="border-line flex items-baseline justify-between gap-4 border-b py-1.5">
      <dt className="text-muted text-sm">{label}</dt>
      <dd className="text-lg font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function PustyStan() {
  return (
    <div className="card text-center">
      <p className="text-lg font-semibold">Nie ma jeszcze żadnych wyników</p>
      <p className="text-muted mt-1">Zagraj pierwszą partie, a statystyki pojawią się tutaj.</p>
      <Link href="/" className="btn btn-primary mt-4">
        Zagraj
      </Link>
    </div>
  );
}

function Podsumowanie({ records, now }: { records: ReadonlyArray<GameRecord>; now: number }) {

  const [poziom, setPoziom] = useState<Filter>("all");
  const [zakres, setZakres] = useState<(typeof ZAKRESY)[number]["key"]>("all");

  let dni: number | null = null;
  if (zakres === "7") dni = 7;
  if (zakres === "30") dni = 30;
  const inRange = FilterDays(records, dni, now);  
  const przefiltrowane = FiltrPoziom(poziom, inRange);
  const statystyki = Agreguj(przefiltrowane);

  const punkty = OstatnieGry(przefiltrowane, 20)
  const poziomy  = WinsPerPreset(inRange);
  const punktyRate       = WinRate(przefiltrowane, 10).slice(-100);
  const utcOffsetMinutes = -new Date(now).getTimezoneOffset();
  const aktywnosc        = DniAktywnosci(FiltrPoziom(poziom, records), now, utcOffsetMinutes, TYGODNIE);
  const aktywneDni       = aktywnosc.filter((dzien) => dzien.count > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          Poziom
          <select
            className="input w-auto"
            value={poziom}
            onChange={(event) => setPoziom(event.target.value as Filter)}
          >
            <option value="all">Wszystkie poziomy</option>
            {PRESET_KEYS.map((key) => (
              <option key={key} value={key}>
                {NAZWY_POZIOMOW[key]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" id="range-label">
            Okres
          </span>
          <ToggleGroup.Root
            type="single"
            value={zakres}
            aria-labelledby="range-label"
            className="flex gap-2"
            onValueChange={(wartosc) => {
               const nastepny = ZAKRESY.find((pozycja) => pozycja.key === wartosc);
              if (nastepny !== undefined) setZakres(nastepny.key);
            }}
            >
            {ZAKRESY.map((pozycja) => (  
              <ToggleGroup.Item key={pozycja.key} value={pozycja.key} className="btn btn-small">
                {pozycja.label}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </div>
      </div>

      <dl className="card grid gap-x-8 sm:grid-cols-2">
        <KartaStat label="Rozegrane gry" value={String(statystyki.played)} />
        <KartaStat label="Odsetek wygranych" value={`${Procent(statystyki)}%`} />
        <KartaStat label="Najdłuższa seria wygranych" value={String(Streaks(przefiltrowane).best)} />
        <KartaStat label="Łączny czas gry" value={FormatTime(statystyki.totalTimeSec)} />
        <KartaStat
         label="Średni czas wygranej"
          value={SredniCzas(przefiltrowane).fold(
            () => "–",
            (seconds) => `${seconds} s`,
          )}   
       />
        <KartaStat
          label="Najlepszy czas"
          value={statystyki.bestTimeSec.fold(
            () => "–",
            (seconds) => `${seconds} s`,
          )}
        />
      </dl>

      {przefiltrowane.length === 0 ? (
        <p className="card text-muted text-center">Brak gier dla wybranych filtrów.</p>
      ) : (
        <>
          <BarChart
            title="Czasy ostatnich 20 gier"
            description="Każdy słupek to jedna gra. Gry są ułożone od najstarszej do najnowszej: numer 1 to najstarsza z pokazanych."
            series={["Wygrana", "Przegrana"]}
            unit="s"
            xTitle="Numer gry (1 = najstarsza z pokazanych)"
           yTitle="Czas (s)"
            groups={punkty.map((punkt, index) => ({
              id: punkt.id,
              label: String(index + 1),
              detail: `Gra ${index + 1}, ${FormatujDate(punkt.date)}, ${NAZWY_POZIOMOW[punkt.presetKey]}`,
              bars: [{ series: punkt.won ? 0 : 1, value: punkt.timeSec }],
            }))}
            table={
              <DataTable
                caption="Czasy ostatnich 20 gier. Każdy wiersz to jedna gra."
                intro="Wiersz to jedna rozegrana gra, a kolumna to jedna cecha tej gry. Kolejność jest taka sama jak na wykresie: od najstarszej do najnowszej."
                columns={[
                  { header: "Nr gry", numeric: true },
                  { header: "Data" },
                  { header: "Poziom" },
                  { header: "Wynik" },
                  { header: "Czas (s)", numeric: true },
                ]}
                rows={punkty.map((punkt, index) => ({
                  id: punkt.id,
                  cells: [
                    index + 1, 
                    FormatujDate(punkt.date),
                    NAZWY_POZIOMOW[punkt.presetKey],
                    punkt.won ? "Wygrana" : "Przegrana",
                    punkt.timeSec,
                  ],
                }))}
              />
            }
          />

          <LineChart
            title="Odsetek wygranych w czasie"
            description={`Średnia krocząca: każdy punkt to odsetek wygranych w danej grze i najwyżej 9 grach przed nią. Pokazane są ostatnie gry (najwyżej 100), od najstarszej (1) do najnowszej.`}
            unit="%"
            max={100}
            xTitle="Numer gry (1 = najstarsza z pokazanych)"
            yTitle="Wygrane z ostatnich 10 gier (%)"
            points={punktyRate.map((punkt, index) => ({
              id: punkt.id,
              value: punkt.rate,
              detail: `Gra ${index + 1}, ${FormatujDate(punkt.date)}`,
            }))}
            table={
              <DataTable
                caption="Odsetek wygranych w czasie. Każdy wiersz to jedna gra."
                intro="Wiersz to jedna gra, a ostatnia kolumna mówi jaki procent gier z okna kończącego się na tej grze był wygrany."
                columns={[
                  { header: "Nr gry", numeric: true },
                  { header: "Data" },
                  { header: "Gier w oknie", numeric: true },
                  { header: "Wygrane w oknie (%)", numeric: true },
                ]}
                rows={punktyRate.map((punkt, index) => ({ 
                  id: punkt.id,
                  cells: [index + 1, FormatujDate(punkt.date), punkt.games, punkt.rate],
                }))}
              />
            }

          />

          <BarChart
            title="Wygrane i przegrane na każdym poziomie"
            description="Jeden słupek na poziom: dolna część to wygrane, górna kreskowana to przegrane. Liczba nad słupkiem to wszystkie rozegrane gry. Ten wykres nie zależy od filtra poziomu."
            series={["Wygrane", "Przegrane"]}
            stacked
            unit="gier"
            xTitle="Poziom"
            yTitle="Liczba gier"
            groups={poziomy.map((podsumowanie) => ({
              id: podsumowanie.presetKey,
              label: NAZWY_POZIOMOW[podsumowanie.presetKey],
              detail: NAZWY_POZIOMOW[podsumowanie.presetKey],
              bars: [
                { series: 0, value: podsumowanie.won },
                { series: 1, value: podsumowanie.played - podsumowanie.won },
              ],
            }))}
            table={
               <DataTable
                caption="Gry na każdym poziomie. Każdy wiersz to jeden poziom."
                intro="Wiersz to jeden poziom trudności, a kolumny to liczby gier na tym poziomie."
                columns={[
                  { header: "Poziom" },
                  { header: "Rozegrane (gry)", numeric: true },
                  { header: "Wygrane (gry)", numeric: true },
                  { header: "Przegrane (gry)", numeric: true },
                  { header: "Odsetek wygranych (%)", numeric: true },
                ]}
                rows={poziomy.map((podsumowanie) => ({
                  id: podsumowanie.presetKey,
                   cells: [
                    NAZWY_POZIOMOW[podsumowanie.presetKey],
                    podsumowanie.played,
                    podsumowanie.won,
                    podsumowanie.played - podsumowanie.won,
                    podsumowanie.played === 0
                      ? "–"
                      : Math.round((podsumowanie.won / podsumowanie.played) * 100),
                  ],
                }))}
              />
            }
          />
        </>
      )}

      <Heatmap
        title={`Aktywność z ostatnich ${TYGODNIE} tygodni`}
        description="Każdy kwadrat to jeden dzień: kolumna to tydzień (najnowszy po prawej), wiersz to dzień tygodnia. Im mocniejszy kolor, tym więcej gier. Ten wykres zawsze pokazuje 12 tygodni, niezależnie od filtra okresu."
        days={aktywnosc}

        formatDate={FormatDayKey}

        table={
          <DataTable
            caption={`Aktywność z ostatnich ${TYGODNIE} tygodni. Każdy wiersz to jeden dzień, w którym rozegrano co najmniej jedną grę.`}
            intro="Wiersz to jeden dzień z grami, od najstarszego do najnowszego. Dni bez gier są pominięte."
            columns={[
              { header: "Data" },
              { header: "Dzień tygodnia" },
              { header: "Liczba gier", numeric: true },
            ]}
            rows={aktywneDni.map((dzien) => ({
              id: dzien.date,
              cells: [FormatDayKey(dzien.date), WEEKDAY_NAMES[dzien.weekday], dzien.count],
            }))}   
          />
        }
      />
    </div>
  );
}

function TabeleRekordow({ records }: { records: ReadonlyArray<GameRecord> }) {
  const poziomy: PresetKey[] = ["beginner", "intermediate", "expert"];


  return (
    <div className="flex flex-col gap-4">
     {poziomy.map((poziom) => {
        const top = Top10(poziom, records);
        return (
          <section key={poziom} className="card" aria-labelledby={`top-${poziom}`}>
            <h2 id={`top-${poziom}`} className="font-bold">
              {NAZWY_POZIOMOW[poziom]}


            </h2>
            {top.length === 0 ? (
              <p className="text-muted mt-2 text-sm">Brak wygranych na tym poziomie.</p>
            ) : (
              <div className="mt-2">
                <DataTable
                  caption={`Najlepsze czasy: ${NAZWY_POZIOMOW[poziom]}. Każdy wiersz to jedna wygrana gra.`}
                  columns={[
                    { header: "Miejsce" },
                    { header: "Czas (s)", numeric: true },
                     { header: "Kliknięcia", numeric: true },
                    { header: "Data" },
                  ]}
                  rows={top.map((rekord, index) => ({
                    id: rekord.id,
                    cells: [
                      `${index + 1}.`,
                       rekord.timeSec,
                      rekord.clicks,
                      FormatujDate(rekord.finishedAt),
                    ],
                  }))}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function StatsView() {
  const { records, now } = useDaneGry();
  if(records.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <PustyStan />
        <DemoPanel />
      </div>
    );
  }

  const najlepszy = Agreguj(records).bestTimeSec;

  return (
    <Tabs.Root defaultValue="summary" className="flex flex-col gap-4">
      <Tabs.List className="flex gap-2" aria-label="Widok statystyk">
        <Tabs.Trigger value="summary" className="btn tab">
          Statystyki
        </Tabs.Trigger>
        <Tabs.Trigger value="records" className="btn tab">
          Rekordy
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="summary" className="flex flex-col gap-4">
        <DemoPanel />
        <Podsumowanie records={records} now={now} />
      </Tabs.Content>
      <Tabs.Content value="records">
        {najlepszy.isJust() ? (
          <TabeleRekordow records={records} />  
        ) : (
          <p className="card text-muted text-center">
            Tabele rekordów wypełnią się po pierwszej wygranej.
          </p>
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}
