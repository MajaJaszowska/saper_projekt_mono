import { czasGry, type GameState } from "../reducers/gameReducer";
import { czyGral, type DailyResult, seriaDzienna } from "./daily";
import { doRekordu, type GameRecord } from "./record";
import { rankOf } from "./statystyki";

export type KoniecKontekst = Readonly<{
  dailyKey: string | null;
  isDemo: boolean;
  records: ReadonlyArray<GameRecord>;
  daily: ReadonlyArray<DailyResult>;
}>;

export type KoniecWynik = Readonly<{
  notka: string | null;
  zapis:
    | Readonly<{ typ: "daily"; wynik: DailyResult }>
    | Readonly<{ typ: "rekord"; rekord: GameRecord }>
    | null;
}>;

const MAX_DLUGOSC_NOTKI = 80; // TODO ucinac za dlugie?

const NIC: KoniecWynik = { notka: null, zapis: null };
const DEMO: KoniecWynik = {
  notka: "Tryb demonstracyjny: ten wynik nie został zapisany.",
  zapis: null,
};

// wyciagniete z Game.tsx bo tam byl straszny balagan
export function podsumujKoniec(gra: GameState, ctx: KoniecKontekst): KoniecWynik {
  if (gra.kind === "daily") {
    if (ctx.dailyKey === null) return NIC;
    if (ctx.isDemo) return DEMO;
    if (czyGral(ctx.daily, ctx.dailyKey)) {
      return {
        notka: "Dzisiejszy wynik planszy dnia jest juz zapisany. To była próba treningowa.",
        zapis: null,
      };
    }

    const wynik: DailyResult = {
      dateKey: ctx.dailyKey,
      won: gra.status === "won",
      timeSec: czasGry(gra, gra.now),
    };
    const notka = wynik.won
      ? `Plansza dnia zaliczona! Seria: ${seriaDzienna([...ctx.daily, wynik], ctx.dailyKey)} dni.`
      : "Plansza dnia zapisana. Jutro kolejna szansa.";
    return { notka, zapis: { typ: "daily", wynik } };
  }

  if (gra.kind !== "normal" || gra.finishedAt === null) return NIC;
  if (ctx.isDemo) return DEMO;

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
  let notka: string | null = null;
  if (rekord.won && rekord.presetKey !== "custom") {
    notka = rankOf(rekord, [...ctx.records, rekord]).fold<string | null>(
      () => null,
      (rank) => (rank === 1 ? "Nowy rekord!" : `${rank}. miejsce w top 10`),
    );
  }
  return { notka, zapis: { typ: "rekord", rekord } };
}
