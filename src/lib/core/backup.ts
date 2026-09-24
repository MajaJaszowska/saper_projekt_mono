import { Either } from "../fp/monady";
import { type DailyResult, czytajDaily } from "./daily";
import { decodeRecords, type GameRecord } from "./record";
import type { Settings } from "./settings";
import { czytajUstawienia, czyObiekt, parseJson } from "./stored";

const BACKUP_APP = "saper-fp";

export const MAX_BACKUP_CHARS = 1_000_000;

export type Backup = Readonly<{
  app: typeof BACKUP_APP;
  version: 1;
  exportedAt: string;
  settings: Settings;
  records: ReadonlyArray<GameRecord>;
  daily: ReadonlyArray<DailyResult>;
}>;

export const zrobBackup = (
  settings: Settings,
  records: ReadonlyArray<GameRecord>,
  daily: ReadonlyArray<DailyResult>,
  teraz: number,
): Backup => ({
  app: BACKUP_APP,
  version: 1,
  exportedAt: new Date(teraz).toISOString(),
  settings,
  records,
  daily,
});

const czyBackup = (wartosc: unknown): Either<string, Record<string, unknown>> =>
  czyObiekt(wartosc) && wartosc.app === BACKUP_APP && wartosc.version === 1
    ? Either.right(wartosc)
    : Either.left("To nie jest plik kopii zapasowej Sapera");

const decodeBackup = (wartosc: unknown): Either<string, Backup> =>
  czyBackup(wartosc).chain((surowe) =>
    czytajUstawienia(surowe.settings).chain((settings) =>
      decodeRecords(surowe.records).chain((records) =>
        czytajDaily(surowe.daily ?? []).map((daily) =>
          zrobBackup(
            settings,
            records,
            daily,
            typeof surowe.exportedAt === "string" && !Number.isNaN(Date.parse(surowe.exportedAt))
              ? Date.parse(surowe.exportedAt)
              : 0,
          ),
        ),
      ),
    ),
  );

export const parseBackup = (tekst: string): Either<string, Backup> =>
  tekst.length > MAX_BACKUP_CHARS
    ? Either.left("Plik jest za duży (limit to 1 MB)")
    : parseJson(tekst)
        .mapLeft(() => "Plik nie jest poprawnym plikiem JSON")
        .chain(decodeBackup);
