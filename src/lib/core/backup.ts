import { Either } from "../fp/monady";
import {type DailyResult, CzytajDaily} from "./daily"; 
import {DecodeRecords, type GameRecord} from "./record";


import type { Settings } from "./settings";
import { CzytajUstawienia, IsObject, ParseJson } from "./stored";

const BACKUP_APP =  "saper-fp";
export const MAX_BACKUP_CHARS = 1_000_000; 

export type Backup = Readonly<{
  app: typeof BACKUP_APP;
  version: 1;
  exportedAt: string; 
  settings: Settings;
  records:ReadonlyArray<GameRecord>;

  daily: ReadonlyArray<DailyResult>;
}>;

export const ZrobBackup =  (
 settings:Settings,
 records: ReadonlyArray<GameRecord>,   
  daily: ReadonlyArray<DailyResult>,
	teraz: number,
): Backup =>  ({
  app: BACKUP_APP,
  version: 1,
  exportedAt: new Date(teraz).toISOString(),
  settings,
  records,
	daily,
});

const CzyBackup = (wartosc: unknown): Either<string, Record<string, unknown>> =>
  IsObject(wartosc) && wartosc.app === BACKUP_APP && wartosc.version === 1
    ? Either.right(wartosc)
    : Either.left("To nie jest plik kopii zapasowej Sapera");

const DecodeBackup = (wartosc: unknown): Either<string, Backup> =>
   CzyBackup(wartosc).chain((surowe) =>
    CzytajUstawienia(surowe.settings).chain((settings) =>
      DecodeRecords(surowe.records).chain((records) =>
        CzytajDaily(surowe.daily ?? []).map((daily) =>
          ZrobBackup(
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


export const ParseBackup = (tekst: string): Either<string, Backup> =>
  tekst.length > MAX_BACKUP_CHARS
    ? Either.left("Plik jest za duży (limit to 1 MB)")
    : ParseJson(tekst)
        .mapLeft(() => "Plik nie jest poprawnym plikiem JSON")
        .chain(DecodeBackup);   
