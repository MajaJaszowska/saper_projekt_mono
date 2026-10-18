export function Memoize<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  keyFn: (...args: Args) => string,
) {
  const cache = new Map<string, R>();
  return (...args: Args): R => {
    const key = keyFn(...args);
    if(!cache.has(key)) {
      cache.set(key,  fn(...args))
    }  
    return cache.get(key) as R
  };
}

export const Clamp = (x: number, min: number, max: number) => {
  if (x < min) return min;
  if (x > max) return max;
  return x;
};

export function LosowaLiczba(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
