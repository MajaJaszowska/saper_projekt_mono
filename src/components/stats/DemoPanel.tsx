"use client";

import { ToggleGroup } from "radix-ui";
import { DEMO_COUNTS } from "@/lib/core/demo";
import { useApp } from "../AppProvider";

export function DemoPanel() {
  const { demo, startDemo, rerollDemo, stopDemo } = useApp();

  return (
    <section className="card flex flex-col gap-3" aria-labelledby="demo-title">
      <h2 id="demo-title" className="font-bold">
        Tryb testowy
      </h2>
      {demo === null ? (
        <>
          <p className="text-muted text-sm">
            Pokaż przykładowe, wylosowane wyniki, żeby zobaczyć wykresy na większej liczbie gier.
            Twoje prawdziwe wyniki nie zostaną zmienione.
          </p>
          <button
            type="button"
            className="btn btn-primary self-start"
            onClick={() => startDemo(100)}
          >
            Pokaż dane testowe
          </button>
        </>
      ) : (
         <>
          <p className="text-muted text-sm">
            Oglądasz dane testowe. Istnieją tylko w tej karcie przeglądarki i znikną po jej
            zamknięciu.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold" id="demo-count-label"> 
              Liczba gier
            </span>
            <ToggleGroup.Root
              type="single"
              value={String(demo.count)}
              aria-labelledby="demo-count-label"
              className="flex gap-2"
              onValueChange={(wartosc) => {
                const count = DEMO_COUNTS.find((pozycja) => String(pozycja) === wartosc);
                if (count !== undefined) startDemo(count);
              }}
            >
              {DEMO_COUNTS.map((count) => (
                <ToggleGroup.Item key={count} value={String(count)} className="btn">
                  {count}
               </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={rerollDemo}>
              Losuj nowe dane
            </button>  
            <button type="button" className="btn btn-primary" onClick={stopDemo}>
              Wróć do moich danych
            </button>
          </div>
        </>
      )}
    </section>
  );
}
