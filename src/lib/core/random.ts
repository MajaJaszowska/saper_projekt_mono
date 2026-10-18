export const Rand = (seed: number): readonly [number, number] => {
  const state = (seed + 0x6d2b79f5) >>> 0;
  const a = Math.imul(state ^ (state >>> 15), state | 1);
  const b = a ^ (a + Math.imul(a ^ (a >>> 7), a | 61));

  return [((b ^ (b >>> 14)) >>> 0) / 4294967296, state];
};

export const Tasuj = <A>(seed: number, xs: ReadonlyArray<A>): A[] => {
  const wynik = [...xs];
  let s = seed;

  for (let i = wynik.length - 1; i > 0; i -= 1) {
    const [los, nextSeed] = Rand(s);
    s = nextSeed;
    const j = Math.floor(los * (i + 1));
    [wynik[i], wynik[j]] = [wynik[j], wynik[i]];
  }

  return wynik;
};
