"use client";

import {type FormEvent, useState} from "react";
import {CzytajKod, type GameCode} from "@/lib/core/gameCode";


type Props =  {
  currentCode: string | null;
  onLoad: (kod: GameCode) => void;
  onRandom: () => void;
};

export function CodePanel({ currentCode, onLoad, onRandom }: Props){
    const [input, setInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [statusKopii, setStatusKopii] = useState<string | null>(null);
    const WczytajKod = (event: FormEvent) =>  {
        event.preventDefault();
        console.log("kod: " + input);
        CzytajKod(input).fold(setError, (kod) => {
            setError(null);
            setInput("");
            onLoad(kod);
        });
    }

    const Kopiuj = async (kod: string) => {
        try {
            await navigator.clipboard.writeText(kod);
            setStatusKopii("Skopiowano!");
        } catch {
            setStatusKopii("Nie udało się skopiować. Zaznacz kod ręcznie.");
        }
    };

    return (
        <section className="card flex w-full max-w-md flex-col gap-3" aria-labelledby="code-title">
            <h2 id="code-title" className="font-bold">
                Kod planszy
      </h2>

            {currentCode === null ? (
                <p className="text-muted text-sm">
                    Zagraj planszę, którą możesz wysłać znajomym: każdy z tym samym kodem dostanie ten sam
          układ min.
        </p>
            ) : (
                <div className="flex flex-wrap items-center gap-2">
                    <code className="bg-surface-2 px-2 py-1 font-mono" data-testid="current-code">
                        {currentCode}
                    </code>
                    <button type="button" className="btn" onClick={() => void Kopiuj(currentCode)}>
                        Kopiuj kod planszy
          </button>
                    <span className="text-muted text-sm" aria-live="polite">
                        {statusKopii} 

                    </span>
                </div>
            )}

            <button type="button" className="btn self-start" onClick={onRandom}>
                Losuj planszę z kodem
      </button>
            <form onSubmit={WczytajKod} noValidate className="flex flex-col gap-2">   
                <label htmlFor="code-input" className="text-sm font-semibold">
                    Wczytaj kod
        </label>
                <div className="flex gap-2">
                    <input
                        id="code-input"
                        className="input font-mono"
                        placeholder="S1-9x9-10-abc123"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        aria-invalid={error !== null}
                        aria-describedby="code-error"
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <button type="submit" className="btn btn-primary">
                        Wczytaj
          </button>
                </div>
                <p id="code-error" className="text-danger min-h-5 text-sm font-semibold" role="alert">
                    {error}
                </p>
            </form>
        </section>
    );
}