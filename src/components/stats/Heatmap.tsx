"use client";   
import { type ReactNode, useState } from "react";
import type { ActivityDay } from "@/lib/core/statystyki";
import { ChartFrame } from "./ChartFrame";

type Props =  {
  title: string;
  description: string;
  days: ReadonlyArray<ActivityDay>;
  formatDate: (date: string) => string;
  table: ReactNode;
  };

const CELL = 22;
const GAP  = 4;
const LEFT = 34;

const TOP          = 8; 
const DNI_TYGODNIA = ["pon.", "wt.", "śr.", "czw.", "pt.", "sob.", "niedz."];

const POZIOMY = [22,48, 74, 100];

function PoziomKoloru(count: number, max: number) {
  if (count === 0) return -1;
  return Math.min(3, Math.floor(((count - 1) / max) * 4));
}

const KolorPola = (poziom: number): string =>
	poziom < 0
    ? "var(--surface-2)"
    : `color-mix(in srgb, var(--series-1) ${POZIOMY[poziom]}%, var(--surface))`;

  export function Heatmap({ title, description, days, formatDate, table }: Props) {
  const [active, setActive] = useState<ActivityDay | null>(null);

   let tygodnie = 1;
  let max = 1;

  for (let i = 0; i < days.length; i++) {
    if (days[i].week + 1 > tygodnie) tygodnie = days[i].week + 1;
    if (days[i].count > max) max = days[i].count;
  }
  const width    = LEFT + tygodnie * (CELL + GAP);
  const wysokosc = TOP + 7 * (CELL + GAP);

  return (
    <ChartFrame title={title} description={description} legend={[]} table={table}>
      <div className="chart-scroll">
        <svg
          viewBox={`0 0 ${width} ${wysokosc}`}
          style={{ width: "100%", maxWidth: `${width * 1.4}px`, minWidth: `${width}px` }}
          role="img"
          aria-label={`${title}. Te same dane są w tabeli pod wykresem.`}
          onMouseLeave={() => setActive(null)}
        >
          {DNI_TYGODNIA.map((nazwa, dzienTyg) =>   
            dzienTyg % 2 === 0 ? (  
              <text
                key={nazwa}
                x={LEFT - 6}
                 y={TOP + dzienTyg * (CELL + GAP) + CELL * 0.68}
                textAnchor="end"
                fontSize="10"
                fill="var(--muted)"
              >
                 {nazwa}
              </text>
            ) : null,
          )}
          {days
            .filter((dzien) => !dzien.future)
            .map((dzien) => (
              <rect
                key={dzien.date}



                x={LEFT + dzien.week * (CELL + GAP)}
                y={TOP + dzien.weekday * (CELL + GAP)}
                width={CELL}
                height={CELL}
                fill={KolorPola(PoziomKoloru(dzien.count, max))}
                stroke={active?.date === dzien.date ? "var(--text)" : "none"}
                strokeWidth="2"   
                onMouseEnter={() => setActive(dzien)}
              />
            ))}
        </svg>
      </div>

      <div className="text-muted flex flex-wrap items-center justify-between gap-2 text-sm">   
        <span aria-live="polite">
          {active === null
            ? "Najedź na dzień, żeby zobaczyc liczbę gier."
            : `${formatDate(active.date)}: ${active.count} ${active.count === 1 ? "gra" : "gier"}`}
        </span>
        <span className="flex items-center gap-1" aria-hidden="true">
          mniej
          {[-1, 0, 1, 2, 3].map((poziom) => (
            <span
              key={poziom}
              className="inline-block h-3 w-3"
              style={{ background: KolorPola(poziom) }}
            />
          ))}
          więcej
        </span>
      </div>
    </ChartFrame>
  );
}
