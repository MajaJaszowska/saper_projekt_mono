"use client";

 import { type ReactNode,useId, useState } from "react";
import { ChartFrame } from "./ChartFrame";

export type ChartGroup = Readonly<{
  id: string;
  label: string;
  detail: string;
  bars: ReadonlyArray<Readonly<{ series: number; value: number }>>;
}>;

type Props = {

  title: string;
  description?: string; 
  series: ReadonlyArray<string>;
  groups: ReadonlyArray<ChartGroup>;   
  unit: string;  
  xTitle: string;
  yTitle: string;
  stacked?: boolean;
  labelEvery?: number;
  table: ReactNode;
};

const WIDTH = 640
const WYSOKOSC = 260;   
const PAD = { top: 22, right: 8, bottom: 46, left: 50 };
const PLOT_W         = WIDTH - PAD.left - PAD.right;   
const PLOT_H         =  WYSOKOSC - PAD.top - PAD.bottom
const ODSTEP_SLUPKOW = 2;
const MAX_BAR        = 24;

const KOLORY_SERII = ["var(--series-1)", "var(--series-2)"];   

function OkraglyMax(wartosc: number): number {
  if(wartosc <= 4) return 4;
  const rzad = 10 ** Math.floor(Math.log10(wartosc));
  const krok = [1, 2, 4, 5, 10].find((s) => s * rzad >= wartosc) ?? 10;
  return krok * rzad;
}
const BarPath  = (x: number, y: number, width: number, wysokosc: number, runda: boolean): string => {
  const r = runda ? Math.min(4, width / 2, wysokosc) : 0;
  return `M${x},${y + wysokosc} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + wysokosc} Z`;
};


type Mark = { x: number; y: number; width: number; height: number; series: number; value: number; round: boolean; label: boolean };
export function BarChart({
  title,
  description,
  series,
  groups,
  unit,
  xTitle,
  yTitle,
  stacked = false,
  labelEvery = 1,
  table,
}: Props){
  const [active, setActive] = useState<number | null>(null);
  const idKreskowania = useId();

  const SumaZ = (grupa: ChartGroup) => grupa.bars.reduce((suma, bar) => suma + bar.value, 0);
  const max   = OkraglyMax(
    Math.max(   
       1,   
      ...groups.map((g) => (stacked ? SumaZ(g) : Math.max(0, ...g.bars.map((b) =>  b.value)))),
    ),   
  );
  const ticks = [0, max / 2, max];
  const slot=PLOT_W / Math.max(groups.length, 1);   
  const naGrupe    = stacked ? 1 : Math.max(1, ...groups.map((g) => g.bars.length));
  const szerSlupka = Math.min(MAX_BAR, (slot * 0.8 - ODSTEP_SLUPKOW * (naGrupe - 1)) / naGrupe);
  const szerGrupy  = szerSlupka * naGrupe + ODSTEP_SLUPKOW * (naGrupe - 1);
 const baseline = PAD.top + PLOT_H;
  const Wys = (wartosc : number) => (wartosc / max) * PLOT_H;

  const SlupkiGrupy=(grupa: ChartGroup, nr: number): Mark[] => {
    const start = PAD.left + slot * nr + (slot - szerGrupy) / 2;
    if (!stacked) {
      return grupa.bars.map((bar, barIndex) => {
        const wysokosc = Math.max(Wys(bar.value), 2);
        return {

          x: start + barIndex * (szerSlupka + ODSTEP_SLUPKOW),
          y: baseline - wysokosc,
          width: szerSlupka,
          height: wysokosc,
          series: bar.series,
          value: bar.value,
           round: true,
          label: true,
        };

        });
    }

    const widoczne = grupa.bars.filter((bar) => bar.value > 0);
    let top        = baseline;
    return widoczne.map((bar, barIndex) => {
      const full = Wys(bar.value);
        const czyOstatni = barIndex === widoczne.length - 1;
      const wysokosc = Math.max(full - (czyOstatni ? 0 : ODSTEP_SLUPKOW), 1);
      const znacznik = {
        x: start,
        y: top - full + (czyOstatni ? 0 : ODSTEP_SLUPKOW),
        width: szerSlupka,
        height: wysokosc,
        series: bar.series,
        value: bar.value,
        round: czyOstatni,
        label: false,
      };
      top -= full;
      return znacznik;
    });
  };

  const aktywnaGrupa = active === null ? undefined : groups[active];

  return (   
    <ChartFrame
      title={title}
      description={description}
      legend={series.length > 1 ? series : []}
      table={table}  
    >
      <div className="chart-scroll relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${WYSOKOSC}`}   
         className="chart-svg"
          role="img"
          aria-label={`${title}. Te same dane są w tabeli pod wykresem.`}
          onMouseLeave={() => setActive(null)}
        >
           <defs>
            <pattern id={idKreskowania} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--surface)" strokeWidth="2" opacity="0.45" />
            </pattern>
          </defs>

          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={baseline - Wys(tick)}
                y2={baseline - Wys(tick)}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text x={PAD.left - 6} y={baseline - Wys(tick) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
                {tick}
              </text>
            </g>
          ))}


          <text
           x={14}
             y={PAD.top + PLOT_H / 2}
             textAnchor="middle"
            fontSize="12"
            fill="var(--muted)"
            transform={`rotate(-90 14 ${PAD.top + PLOT_H / 2})`}
          >
            {yTitle}
          </text>
          <text x={PAD.left + PLOT_W / 2} y={WYSOKOSC - 6} textAnchor="middle" fontSize="12" fill="var(--muted)">  
            {xTitle} 
          </text>

          {groups.map((grupa, nr) => {
	          const znaczniki = SlupkiGrupy(grupa, nr);
            const center = PAD.left + slot * nr + slot / 2;
            return (
              <g key={grupa.id} opacity={active === null || active === nr ? 1 : 0.45}>
                {znaczniki.map((znacznik, markIndex) => (
                  <g key={markIndex}>
	                  <path
                      d={BarPath(znacznik.x, znacznik.y, znacznik.width, znacznik.height, znacznik.round)}

                      fill={KOLORY_SERII[znacznik.series]}
                    />
                    {znacznik.series === 1 && (
                      <path
                        d={BarPath(znacznik.x, znacznik.y, znacznik.width, znacznik.height, znacznik.round)}
                        fill={`url(#${idKreskowania})`}
                      />
                    )}
                    {znacznik.label && (
                      <text
                        x={znacznik.x + znacznik.width / 2}
                        y={znacznik.y - 4} 
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"  
                          fill="var(--text)"
                      >
                        {znacznik.value}
                      </text>
                    )}



                  </g>
                ))}
                {stacked && (
                  <text
                    x={center}
                    y={baseline - Wys(SumaZ(grupa)) - 4}

                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="var(--text)"
                  >
                    {SumaZ(grupa)}
                  </text>
                )}
                {nr % labelEvery === 0 && (
                  <text x={center} y={baseline + 15} textAnchor="middle" fontSize="11" fill="var(--muted)">
                    {grupa.label}  
                  </text>
                )}
                <rect
                  x={PAD.left + slot * nr}   
                  y={PAD.top}
                  width={slot}
                  height={PLOT_H}
                  fill="transparent"
                  onMouseEnter={() => setActive(nr)}
                />
               </g>
            );
          })}
        </svg>

        {aktywnaGrupa !== undefined && active !== null && (
	        <div
            className="border-line bg-surface pointer-events-none absolute top-0 z-10 border px-2 py-1 text-sm"
            style={{
              left: `${((PAD.left + slot * (active + 0.5)) / WIDTH) * 100}%`,
              transform: `translateX(${active > groups.length / 2 ? "-100%" : "0"})`,
            }}
          >
            <div className="font-semibold">{aktywnaGrupa.detail}</div>
            {aktywnaGrupa.bars.map((bar, barIndex) => (
              <div key={barIndex} className="flex items-center gap-1.5">
                <span className={`swatch swatch-${bar.series + 1}`} />
                {series[bar.series]}: {bar.value} {unit}
              </div>
            ))}
          </div>
        )}
      </div>
    </ChartFrame>
  ); 
}
