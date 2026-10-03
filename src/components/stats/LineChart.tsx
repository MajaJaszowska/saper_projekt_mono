"use client";

import { type ReactNode, useState } from "react";
import { ChartFrame } from "./ChartFrame";

export type LinePoint = Readonly<{ id: string; value: number; detail: string }>;

type Props = Readonly<{
  title: string;
  description: string;
  points: ReadonlyArray<LinePoint>;
  unit: string;
  xTitle: string;
  yTitle: string;
  max: number;
  table: ReactNode;
}>;

const WIDTH = 640;
const WYSOKOSC = 260;
const PAD = { top: 22, right: 44, bottom: 46, left: 50 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = WYSOKOSC - PAD.top - PAD.bottom;

export function LineChart({ title, description, points, unit, xTitle, yTitle, max, table }: Props) {
  const [active, setActive] = useState<number | null>(null);

  const baseline = PAD.top + PLOT_H;
  const xOf = (index: number) =>
    PAD.left + (points.length <= 1 ? PLOT_W / 2 : (index / (points.length - 1)) * PLOT_W);
  const yOf = (wartosc: number) => baseline - (wartosc / max) * PLOT_H;
  const sciezka = points.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i)},${yOf(p.value)}`).join(" ");
  const ticks = [0, max / 2, max];
  const every = Math.max(1, Math.ceil(points.length / 8));
  const ostatni = points.length - 1;
  const aktywnyPunkt = active === null ? undefined : points[active];

  const ruchMyszy = (clientX: number, cel: SVGSVGElement) => {
    const box = cel.getBoundingClientRect();
    const x = ((clientX - box.left) / box.width) * WIDTH;
    const index = Math.round(((x - PAD.left) / PLOT_W) * ostatni);
    setActive(Math.min(Math.max(index, 0), ostatni));
  };

  return (
    <ChartFrame title={title} description={description} legend={[]} table={table}>
      <div className="chart-scroll relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${WYSOKOSC}`}
          className="chart-svg"
          role="img"
          aria-label={`${title}. Te same dane są w tabeli pod wykresem.`}
          onMouseMove={(event) => ruchMyszy(event.clientX, event.currentTarget)}
          onMouseLeave={() => setActive(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={yOf(tick)}
                y2={yOf(tick)}
                stroke="var(--border)"
                strokeWidth="1"
              />
              <text x={PAD.left - 6} y={yOf(tick) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
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
          {points.map((punkt, index) =>
            index % every === 0 || index === ostatni ? (
              <text
                key={punkt.id}
                x={xOf(index)}
                y={baseline + 15}
                textAnchor="middle"
                fontSize="11"
                fill="var(--muted)"
              >
                {index + 1}
              </text>
            ) : null,
          )}

          <path
            d={sciezka}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {ostatni >= 0 && (
            <>
              <circle
                cx={xOf(ostatni)}
                cy={yOf(points[ostatni].value)}
                r="5"
                fill="var(--series-1)"
                stroke="var(--surface)"
                strokeWidth="2"
              />
              <text
                x={xOf(ostatni) + 9}
                y={yOf(points[ostatni].value) + 4}
                fontSize="11"
                fontWeight="600"
                fill="var(--text)"
              >
                {points[ostatni].value}
                {unit}
              </text>
            </>
          )}

          {active !== null && aktywnyPunkt !== undefined && (
            <>
              <line x1={xOf(active)} x2={xOf(active)} y1={PAD.top} y2={baseline} stroke="var(--muted)" strokeWidth="1" />
              <circle
                cx={xOf(active)}
                cy={yOf(aktywnyPunkt.value)}
                r="5"
                fill="var(--series-1)"
                stroke="var(--surface)"
                strokeWidth="2"
              />
            </>
          )}
        </svg>

        {active !== null && aktywnyPunkt !== undefined && (
          <div
            className="border-line bg-surface pointer-events-none absolute top-0 z-10 rounded-lg border px-2 py-1 text-sm shadow-lg"
            style={{
              left: `${(xOf(active) / WIDTH) * 100}%`,
              transform: `translateX(${active > ostatni / 2 ? "calc(-100% - 8px)" : "8px"})`,
            }}
          >
            <div className="font-semibold">{aktywnyPunkt.detail}</div>
            <div>
              {aktywnyPunkt.value}
              {unit}
            </div>
          </div>
        )}
      </div>
    </ChartFrame>
  );
}
