import * as R from "ramda";
import { Either } from "../fp/monady";
import { isKolorHex } from "./color";
import { LIMITY, sprawdzConfig } from "./config";
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

export const czyObiekt = (wartosc: unknown): wartosc is Record<string, unknown> =>
  typeof wartosc === "object" && wartosc !== null && !Array.isArray(wartosc);

export const parseJson = (surowe: string): Either<string, unknown> =>
  Either.tryCatch((): unknown => JSON.parse(surowe)).mapLeft(() => "Dane nie są poprawnym JSON-em");

export const odpakuj = (wartosc: unknown): Either<string, unknown> => {
  if (czyObiekt(wartosc) && wartosc.version === 1 && "data" in wartosc) {
    return Either.right(wartosc.data);
  }
  return Either.left("Nieznana wersja zapisanych danych");
};

export const odpakujUst = (wartosc: unknown): Either<string, unknown> => {
  if (czyObiekt(wartosc) && (wartosc.version === 1 || wartosc.version === 2) && "data" in wartosc) {
    return Either.right(wartosc.data);
  }
  return Either.left("Nieznana wersja zapisanych danych");
};

export const oneOf =
  <T extends string>(allowed: ReadonlyArray<T>) =>
  (wartosc: unknown): boolean =>
    typeof wartosc === "string" && allowed.some((item) => item === wartosc);

export function isLiczba(wartosc: unknown): boolean {
  return typeof wartosc === "number" && Number.isInteger(wartosc) && wartosc >= 0;
}

export const isConfigShape = (wartosc: unknown): wartosc is Config =>
  czyObiekt(wartosc) &&
  R.where(
    {
      rows: (wiersze: unknown) => isLiczba(wiersze) && (wiersze as number) <= 30,
      cols: (cols: unknown) => isLiczba(cols) && (cols as number) <= LIMITY.maxCols,
      mines: isLiczba,
    },
    wartosc,
  );

export const isPresetKey = oneOf(["beginner", "intermediate", "expert", "custom"]);

const jedenZ =
  <T extends string>(allowed: ReadonlyArray<T>, zapasowy: T) =>
  (wartosc: unknown): T =>
    allowed.find((item) => item === wartosc) ?? zapasowy;

const boolAlbo = (zapasowy: boolean) => (wartosc: unknown) =>
  typeof wartosc === "boolean" ? wartosc : zapasowy;

export const czytajUstawienia = (wartosc: unknown): Either<string, Settings> => {
  if (!czyObiekt(wartosc)) return Either.left("Zapisane ustawienia mają nieprawidłowy format");

  const d = DOMYSLNE;
  return Either.right({
    theme: jedenZ(MOTYWY, d.theme)(wartosc.theme),
    skin: jedenZ(SKINS, d.skin)(wartosc.skin),
    accent: isKolorHex(wartosc.accent) ? wartosc.accent.toLowerCase() : d.accent,
    iconSet: jedenZ(ICON_SETS, d.iconSet)(wartosc.iconSet),
    cellStyle: jedenZ(CELL_STYLES, d.cellStyle)(wartosc.cellStyle),
    cellSize: jedenZ(ROZMIARY_POLA, d.cellSize)(wartosc.cellSize),
    questionMarks: boolAlbo(d.questionMarks)(wartosc.questionMarks),
    chording: boolAlbo(d.chording)(wartosc.chording),
    animations: boolAlbo(d.animations)(wartosc.animations),
    lastPreset: jedenZ(
      ["beginner", "intermediate", "expert", "custom"] as const,
      d.lastPreset,
    )(wartosc.lastPreset),
    customConfig: isConfigShape(wartosc.customConfig)
      ? sprawdzConfig({
          rows: wartosc.customConfig.rows,
          cols: wartosc.customConfig.cols,
          mines: wartosc.customConfig.mines,
        }).getOrElse(d.customConfig)
      : d.customConfig,
  });
};
