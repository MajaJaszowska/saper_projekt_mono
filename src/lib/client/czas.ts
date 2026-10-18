"use client";

import { useEffect,  useState } from "react";
export const GetTime = () => Date.now();
export function RandomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff)
}

export const useZegar = (active: boolean): number => {
  const [now, setNow] = useState(0);

  useEffect(() => {

    if(!active) return;
    const id  = setInterval(() => setNow(GetTime()), 250);
    return () => clearInterval(id)
	}, [active]);

  return now;
};

