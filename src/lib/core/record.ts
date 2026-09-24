import * as R from "ramda";
import { Either, sequence } from "../fp/monady";
import { jakiPreset } from "./config";
import { isConfigShape, isLiczba, czyObiekt, isPresetKey, oneOf } from "./stored";
import type { Config, Kind, PresetKey } from "./types";

export type GameRecord = Readonly<{
  id: string;
  finishedAt: string;
  kind: Kind;
  presetKey: PresetKey;
  config: Config;
  won: boolean;
  timeSec: number;
  clicks: number;
  hintsUsed: number;
  flagsUsed: number;
  bbbv: number | null;
}>;

export const doRekordu = (game: {
  kind: Kind;
  config: Config;
  seed: number;
  won: boolean;
  finishedAt: number;
  timeSec: number;
  clicks: number;
  flagsUsed: number;
}): GameRecord => ({
  id: `${game.finishedAt.toString(36)}-${game.seed.toString(36)}`,
  finishedAt: new Date(game.finishedAt).toISOString(),
  kind: game.kind,
  presetKey: jakiPreset(game.config),
  config: game.config,
  won: game.won,
  timeSec: game.timeSec,
  clicks: game.clicks,
  hintsUsed: 0,
  flagsUsed: game.flagsUsed,
  bbbv: null,
});

export function dopiszRekord(rekordy: ReadonlyArray<GameRecord>, rekord: GameRecord): GameRecord[] {
  const arr = [...rekordy, rekord];
  return arr.slice(-500);
}

const isIsoDate = (wartosc: unknown): boolean =>
  typeof wartosc === "string" && !Number.isNaN(Date.parse(wartosc));

const czyRekord = (wartosc: unknown): wartosc is GameRecord =>
  czyObiekt(wartosc) &&
  R.where(
    {
      id: R.is(String),
      finishedAt: isIsoDate,
      kind: oneOf(["normal", "code"]),
      presetKey: isPresetKey,
      config: isConfigShape,
      won: R.is(Boolean),
      timeSec: isLiczba,
      clicks: isLiczba,
      hintsUsed: isLiczba,
      flagsUsed: isLiczba,
      bbbv: (bbbv: unknown) => bbbv === null || isLiczba(bbbv),
    },
    wartosc,
  );

const RECORD_KEYS = ["id", "finishedAt", "kind", "presetKey", "config", "won", "timeSec", "clicks", "hintsUsed", "flagsUsed", "bbbv"] as const;

const decodeRecord = (wartosc: unknown, index: number): Either<string, GameRecord> =>
  czyRekord(wartosc)
    ? Either.right(R.pick(RECORD_KEYS, wartosc))
    : Either.left(`Rekord nr ${index + 1} ma nieprawidłowy format`);

export const decodeRecords = (wartosc: unknown): Either<string, GameRecord[]> =>
  Array.isArray(wartosc)
    ? sequence(wartosc.map(decodeRecord)).map((rekordy) => R.takeLast(500, rekordy))
    : Either.left("Zapisane wyniki mają nieprawidłowy format");
