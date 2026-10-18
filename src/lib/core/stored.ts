import * as R from "ramda";
import { Either } from "../fp/monady";
 import { IsKolorHex } from "./color";
import {LIMITY, ValidateConfig} from "./config";
import {
 ROZMIARY_POLA,
  CELL_STYLES,
  DOMYSLNE,
  ICON_SETS,
  type Settings,
  SKINS,
  MOTYWY,
} from "./settings";
import type { Config } from "./types";

export const IsObject=(wartosc: unknown): wartosc is Record<string, unknown> =>
  typeof wartosc === "object" && wartosc !== null && !Array.isArray(wartosc);
export const ParseJson = (surowe: string): Either<string, unknown> =>
  Either.tryCatch((): unknown => JSON.parse(surowe)).mapLeft(() => "Dane nie są poprawnym JSON-em");

export const Odpakuj = (wartosc: unknown): Either<string, unknown> => {
  if (IsObject(wartosc) && wartosc.version === 1 && "data" in wartosc) {
    return Either.right(wartosc.data);
  }
  return Either.left("Nieznana wersja zapisanych danych");
};  

export const OdpakujUst = (wartosc: unknown): Either<string,  unknown> => {
  if (IsObject(wartosc) && (wartosc.version === 1 || wartosc.version === 2) && "data" in wartosc) {
    return Either.right(wartosc.data);
  }
  return Either.left("Nieznana wersja zapisanych danych");
};

export const OneOf =
  <T extends string>(allowed: ReadonlyArray<T>) =>
  (wartosc: unknown): boolean =>
    typeof wartosc === "string" && allowed.some((item) => item === wartosc)

export function IsLiczba(wartosc: unknown): boolean {

  return typeof wartosc === "number" && Number.isInteger(wartosc) && wartosc >= 0;
}

export const IsConfigShape = (wartosc: unknown): wartosc is Config =>
 IsObject(wartosc) &&
  R.where(
    { 
      rows: (wiersze: unknown) => IsLiczba(wiersze) && (wiersze as number) <= 30,
      cols: (cols: unknown) =>  IsLiczba(cols) && (cols as number) <= LIMITY.maxCols,
      mines: IsLiczba,  
    },
	  wartosc,
  );

export const isPresetKey =  OneOf(["beginner", "intermediate", "expert", "custom"]);

const JedenZ =
  <T extends string>(allowed: ReadonlyArray<T>, zapasowy: T) =>
  (wartosc: unknown): T =>
    allowed.find((item) => item === wartosc) ?? zapasowy;

const BoolAlbo = (zapasowy: boolean) => (wartosc: unknown) =>
  typeof wartosc === "boolean" ? wartosc : zapasowy;

export const CzytajUstawienia = (wartosc: unknown): Either<string, Settings> => {
  if (!IsObject(wartosc)) return Either.left("Zapisane ustawienia mają nieprawidłowy format");

  const d   = DOMYSLNE;
  return Either.right({ 
    theme: JedenZ(MOTYWY, d.theme)(wartosc.theme),
    skin: JedenZ(SKINS, d.skin)(wartosc.skin),
    accent: IsKolorHex(wartosc.accent) ? wartosc.accent.toLowerCase() : d.accent,
    iconSet: JedenZ(ICON_SETS, d.iconSet)(wartosc.iconSet),
    cellStyle: JedenZ(CELL_STYLES, d.cellStyle)(wartosc.cellStyle),
    cellSize: JedenZ(ROZMIARY_POLA, d.cellSize)(wartosc.cellSize),
    questionMarks: BoolAlbo(d.questionMarks)(wartosc.questionMarks),
    chording: BoolAlbo(d.chording)(wartosc.chording),
    animations: BoolAlbo(d.animations)(wartosc.animations),
    lastPreset : JedenZ(   
      ["beginner", "intermediate", "expert", "custom"] as const,  
      d.lastPreset,
    )(wartosc.lastPreset),
    customConfig: IsConfigShape(wartosc.customConfig)
      ? ValidateConfig({   
          rows: wartosc.customConfig.rows,
          cols: wartosc.customConfig.cols,
          mines: wartosc.customConfig.mines,
          }).getOrElse(d.customConfig)
      : d.customConfig,
  });
 };
