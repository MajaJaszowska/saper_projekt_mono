import { neigbours } from "../core/plansza";
import { ukladZKodu, losujMiny } from "../core/mines";
import { odkryj } from "../core/reveal";
import type { Board, Config, Kind, Pos, RevealResult, Status } from "../core/types";
import { czyWygrana, pokazMiny, oflagujReszte, chord, zmienZnacznik } from "../core/ruchy";

export type GameAction =
  | { type: "REVEAL"; pos: Pos; now: number }
  | { type: "MARK"; pos: Pos; now: number; allowQuestion: boolean }
  | { type: "CHORD"; pos: Pos; now: number };

export type GameEvent =
  | GameAction
  | { type: "NEW_GAME"; kind: Kind; config: Config; seed: number; now: number };

export type GameState = Readonly<{
  kind: Kind;
  config: Config;
  seed: number;
  status: Status;
  board: Board | null;
  exploded: Pos | null;
  startedAt: number | null;
  finishedAt: number | null;
  now: number;
  clicks: number;
  flagsUsed: number;
  actions: ReadonlyArray<GameAction>;
}>;

export const startGry = (rodzaj: Kind, config: Config, seed: number, teraz: number): GameState => {
  const baza: GameState = {
    kind: rodzaj,
    config,
    seed,
    status: "ready",
    board: null,
    exploded: null,
    startedAt: null,
    finishedAt: null,
    now: teraz,
    clicks: 0,
    flagsUsed: 0,
    actions: [],
  };
  if (rodzaj === "normal") return baza;

  return ukladZKodu(config, seed).fold(
    (): GameState => ({ ...baza, kind: "normal" }),
    ({ board, start }): GameState => {
      const otwarte = odkryj(board, start).board;
      if (czyWygrana(otwarte)) {
        return {
          ...baza,
          board: oflagujReszte(otwarte),
          status: "won",
          startedAt: teraz,
          finishedAt: teraz,
        };
      }
      return { ...baza, board: otwarte };
    },
  );
};

export function gameReducer(state: GameState, event: GameEvent): GameState {
  if (event.type === "NEW_GAME") {
    return startGry(event.kind, event.config, event.seed, event.now);
  }
  if (state.status === "won" || state.status === "lost") return state;

  if (event.type == "MARK") {
    if (state.board === null) return state;
    const nowa = zmienZnacznik(event.allowQuestion, state.board, event.pos);
    if (nowa === null) return state;
    let flagi = state.flagsUsed;
    if (nowa[event.pos.row][event.pos.col].mark === "flag") flagi = flagi + 1;
    return {
      ...state,
      board: nowa,
      now: event.now,
      flagsUsed: flagi,
      actions: [...state.actions, event],
    };
  }

  let wynik: RevealResult;
  if (event.type === "REVEAL") {
    let plansza = state.board;
    if (plansza === null) {
      plansza = losujMiny(state.config, state.seed, [
        event.pos,
        ...neigbours(state.config, event.pos),
      ]);
    }
    wynik = odkryj(plansza, event.pos);
  } else {
    if (state.board === null) return state;
    const tmp = chord(state.board, event.pos);
    if (tmp === null) return state;
    wynik = tmp;
  }

  if (wynik.order.length === 0) return state;

  const next: GameState = {
    ...state,
    now: event.now,
    startedAt: state.startedAt ?? event.now,
    clicks: state.clicks + 1,
    actions: [...state.actions, event],
  };

  if (wynik.hitMine) {
    return {
      ...next,
      status: "lost",
      board: pokazMiny(wynik.board),
      exploded: wynik.exploded,
      finishedAt: event.now,
    };
  } else {
    if (czyWygrana(wynik.board)) {
      return { ...next, status: "won", board: oflagujReszte(wynik.board), finishedAt: event.now };
    } else {
      return { ...next, status: "playing", board: wynik.board };
    }
  }
}

export const czasGry = (state: GameState, teraz: number): number => {
  if (state.startedAt === null) return 0;

  const koniec = state.finishedAt ?? Math.max(teraz, state.startedAt);
  return Math.min(999, Math.floor((koniec - state.startedAt) / 1000));
};
