import * as R from "ramda";
import { Either, Sequence } from "../fp/monady";
import { JakiPreset } from "./config";
import {IsConfigShape, IsLiczba, IsObject, isPresetKey, OneOf} from "./stored";
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

export const ToRecord = (game: {
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
  kind : game.kind,
  presetKey: JakiPreset(game.config),
  config: game.config,
  won: game.won,
  timeSec: game.timeSec,
  clicks: game.clicks,
  hintsUsed: 0,
 flagsUsed: game.flagsUsed,
  bbbv: null,
});

export function DopiszRekord(rekordy: ReadonlyArray<GameRecord>, rekord: GameRecord): GameRecord[] {
  const arr = [...rekordy, rekord];
  return arr.slice(-500);
}

const IsIsoDate = (wartosc: unknown): boolean =>
  typeof wartosc === "string" && !Number.isNaN(Date.parse(wartosc));

const CzyRekord  = (wartosc: unknown): wartosc is GameRecord =>
  IsObject(wartosc) &&
  R.where(
    {
      id: R.is(String),
      finishedAt: IsIsoDate,
      kind: OneOf(["normal", "code"]),
      presetKey: isPresetKey,
      config: IsConfigShape,
        won: R.is(Boolean),
      timeSec: IsLiczba,
      clicks: IsLiczba, 
      hintsUsed: IsLiczba,
      flagsUsed: IsLiczba,
      bbbv: (bbbv: unknown) => bbbv === null || IsLiczba(bbbv),
    },
    wartosc,
  );

const RECORD_KEYS = ["id", "finishedAt", "kind", "presetKey", "config", "won", "timeSec", "clicks", "hintsUsed", "flagsUsed", "bbbv"] as const;


const DecodeRecord = (wartosc: unknown, index: number): Either<string, GameRecord> =>
	CzyRekord(wartosc)
    ? Either.right(R.pick(RECORD_KEYS, wartosc))
    : Either.left(`Rekord nr ${index + 1} ma nieprawidłowy format`);

export const DecodeRecords = (wartosc: unknown): Either<string, GameRecord[]> =>
  Array.isArray(wartosc)
    ? Sequence(wartosc.map(DecodeRecord)).map((rekordy) =>  R.takeLast(500, rekordy))
    : Either.left("Zapisane wyniki mają nieprawidłowy format");