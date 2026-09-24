"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { nowaPlansza, PUSTE_POLE, samePos } from "@/lib/core/plansza";
import type { IconSet } from "@/lib/core/settings";
import type { Board as BoardData, Config, Pos, Status } from "@/lib/core/types";
import { zlaFlaga } from "@/lib/core/ruchy";
import { Pole } from "./Pole";

type Props = {
  board: BoardData | null;
  config: Config;
  status: Status;
  exploded: Pos | null;
  iconSet: IconSet;
  onPrimary: (pos: Pos) => void;
  onMark: (pos: Pos) => void;
  onPressChange: (wcisniety: boolean) => void;
};

const STRZALKI: Readonly<Record<string, readonly [number, number]>> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

function getPos(cel: EventTarget): Pos | null {
  const el = (cel as HTMLElement).closest<HTMLElement>("[data-row]");
  if (el === null) return null;
  return { row: Number(el.dataset.row), col: Number(el.dataset.col) };
}

const clamp = (value: number, max: number): number => Math.min(Math.max(value, 0), max);

export function Plansza({
  board,
  config,
  status,
  exploded,
  iconSet,
  onPrimary,
  onMark,
  onPressChange,
}: Props) {
  const pusta = useMemo(
    () => nowaPlansza(config.rows, config.cols, () => PUSTE_POLE),
    [config.rows, config.cols],
  );
  const cells = board ?? pusta;

  const siatkaRef = useRef<HTMLDivElement>(null);
  const timerLongPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pominKlik = useRef(false);
  const lastPointerType = useRef("mouse");

  const [focus, setFocus] = useState<Pos>({ row: 0, col: 0 });
  const [origin, setOrigin] = useState<Pos>({ row: 0, col: 0 });
  const zFocusem: Pos = {
    row: clamp(focus.row, config.rows - 1),
    col: clamp(focus.col, config.cols - 1),
  };

  const anulujLongPress = () => {
    if (timerLongPress.current !== null) {
      clearTimeout(timerLongPress.current);
      timerLongPress.current = null;
    }
  };

  const klik = (event: MouseEvent) => {
    if (pominKlik.current) {
      pominKlik.current = false;
      return;
    }
    const pos = getPos(event.target);
    if (pos === null) return;
    console.log("clicked", pos.row, pos.col);

    setOrigin(pos);
    onPrimary(pos);
  };

  const prawyKlik = (event: MouseEvent) => {
    event.preventDefault();
    if (lastPointerType.current === "touch") return;

    const el = (event.target as HTMLElement).closest<HTMLElement>("[data-row]");
    if (el !== null) {
      const x = Number(el.dataset.row);
      const y = Number(el.dataset.col);
      onMark({ row: x, col: y });
    }
  };

  const pointerDown2 = (event: PointerEvent) => {
    lastPointerType.current = event.pointerType;
    const pos = getPos(event.target);
    if (pos === null) return;

    if (event.pointerType === "touch") {
      pominKlik.current = false;
      anulujLongPress();
      timerLongPress.current = setTimeout(() => {
        pominKlik.current = true;
        timerLongPress.current = null;
        onMark(pos);
      }, 450);
    } else if (event.button === 0) {
      onPressChange(true);
    }
  };

  const koniecPointer = () => {
    anulujLongPress();
    onPressChange(false);
  };

  const naKlawisz = (event: KeyboardEvent) => {
    const arrow = STRZALKI[event.key];
    if (arrow !== undefined) {
      event.preventDefault();
      const nastepny: Pos = {
        row: clamp(zFocusem.row + arrow[0], config.rows - 1),
        col: clamp(zFocusem.col + arrow[1], config.cols - 1),
      };
      setFocus(nastepny);
      siatkaRef.current
        ?.querySelector<HTMLElement>(`[data-row="${nastepny.row}"][data-col="${nastepny.col}"]`)
        ?.focus();
      return;
    }
    if (event.key === "f" || event.key === "F") {
      event.preventDefault();
      onMark(zFocusem);
    }
  };

  const lost = status === "lost";

  return (
    <div className="board-scroll">
      <div
        ref={siatkaRef}
        role="grid"
        aria-label={`Plansza ${config.rows} na ${config.cols}, ${config.mines} min`}
        aria-rowcount={config.rows}
        aria-colcount={config.cols}
        className="board"
        data-status={status}
        style={
          {
            "--cols": config.cols,
            "--origin-r": origin.row,
            "--origin-c": origin.col,
          } as CSSProperties
        }
        onClick={klik}
        onContextMenu={prawyKlik}
        onPointerDown={pointerDown2}
        onPointerUp={koniecPointer}
        onPointerCancel={koniecPointer}
        onPointerLeave={koniecPointer}
        onPointerMove={(event) => {
          if (event.pointerType === "touch") anulujLongPress();
        }}
        onKeyDown={naKlawisz}
        onFocus={(event) => {
          const pos = getPos(event.target);
          if (pos !== null && !samePos(pos, focus)) setFocus(pos);
        }}
      >
        {cells.map((rowCells, row) => (
          <div role="row" className="board-row" key={row}>
            {rowCells.map((pole, col) => (
              <Pole
                key={col}
                cell={pole}
                row={row}
                col={col}
                tabbable={zFocusem.row === row && zFocusem.col === col}
                exploded={exploded !== null && exploded.row == row && exploded.col == col}
                wrongFlag={lost && zlaFlaga(pole)}
                iconSet={iconSet}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
