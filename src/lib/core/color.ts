export type Rgb = readonly [number, number, number];
export type Mode = "light" | "dark";

const HEX = /^#[0-9a-f]{6}$/i;

export const isKolorHex = (wartosc: unknown): wartosc is string =>
  typeof wartosc === "string" && HEX.test(wartosc);

export const hex2rgb = (hex: string): Rgb => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

export const rgb2hex = (rgb: Rgb): string =>
  `#${rgb
    .map((kanal) =>
      Math.round(Math.min(255, Math.max(0, kanal)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

const linear = (kanal: number): number => {
  const c = kanal / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const jasnosc = (hex: string): number => {
  const [r, g, b] = hex2rgb(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const kontrast = (a: string, b: string): number => {
  const [lighter, darker] = [jasnosc(a), jasnosc(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

export const mieszaj = (hex: string, cel: string, ile: number): string => {
  const from = hex2rgb(hex);
  const to = hex2rgb(cel);
  return rgb2hex([0, 1, 2].map((i) => from[i] + (to[i] - from[i]) * ile) as unknown as Rgb);
};

const WHITE = "#ffffff";
const BLACK = "#000000";
const KROKI = 25;

export const poprawKontrast = (kolor: string, tlo: string, minimum: number): string => {
  if (kontrast(kolor, tlo) >= minimum) return kolor;

  const away = jasnosc(tlo) > 0.4 ? BLACK : WHITE;
  const inny = away === BLACK ? WHITE : BLACK;

  for (const cel of [away, inny]) {
    for (let krok = 1; krok <= KROKI; krok += 1) {
      const kandydat = mieszaj(kolor, cel, krok / KROKI);
      if (kontrast(kandydat, tlo) >= minimum) return kandydat;
    }
  }
  return kontrast(WHITE, tlo) >= kontrast(BLACK, tlo) ? WHITE : BLACK;
};

export const barwa = (hex: string): number => {
  const [r, g, b] = hex2rgb(hex).map((kanal) => kanal / 255);
  const max = Math.max(r, g, b);
  const roznica = max - Math.min(r, g, b);
  if (roznica === 0) return 0;

  const surowe =
    max === r ? ((g - b) / roznica) % 6 : max === g ? (b - r) / roznica + 2 : (r - g) / roznica + 4;
  return (surowe * 60 + 360) % 360;
};

const roznicaBarwy = (a: number, b: number): number => {
  const diff = Math.abs(a - b) % 360;
  return Math.min(diff, 360 - diff);
};

export const SURFACE: Readonly<Record<Mode, string>> = { light: "#ffffff", dark: "#1e293b" };
const INK = "#111827";

const LOSS_WARM: Readonly<Record<Mode, string>> = { light: "#eb6834", dark: "#d95926" };
const LOSS_COOL: Readonly<Record<Mode, string>> = { light: "#2a78d6", dark: "#3987e5" };

export type AccentTheme = Readonly<{
  accent: string;
  accentText: string;
  chartWin: string;
  chartLoss: string;
}>;

export const koloryAkcentu = (wybrany: string, tryb: Mode): AccentTheme => {
  const widoczne = poprawKontrast(wybrany, SURFACE[tryb], 3);
  const tekstAkcentu = kontrast(widoczne, WHITE) >= kontrast(widoczne, INK) ? WHITE : INK;
  const akcent = poprawKontrast(widoczne, tekstAkcentu, 4.5);

  return {
    accent: akcent,
    accentText: tekstAkcentu,
    chartWin: akcent,
    chartLoss:
      roznicaBarwy(barwa(akcent), barwa(LOSS_WARM[tryb])) < 50
        ? LOSS_COOL[tryb]
        : LOSS_WARM[tryb],
  };
};
