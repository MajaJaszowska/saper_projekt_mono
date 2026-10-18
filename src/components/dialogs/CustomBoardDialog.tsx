"use client";

import {Dialog} from "radix-ui";
import {type FormEvent, useState} from "react"
import {MaxMines, GestoscMin, ValidateConfig} from "@/lib/core/config";
import type { Config } from "@/lib/core/types";
type FormProps = {
  initial: Config;
  onSubmit: (config: Config) => void;
};

const FIELDS = [
  { name: "rows", label: "Wiersze", hint: "5–30" },
  { name: "cols", label: "Kolumny", hint: "5–40" },
  { name: "mines", label: "Miny", hint: "min. 1" },
] as const;

const NaLiczbe = (tekst: string): number => (tekst.trim() === "" ? Number.NaN : Number(tekst));

export function CustomBoardForm({ initial, onSubmit }: FormProps) {
  const [values, setValues] = useState({
    rows: String(initial.rows),
    cols: String(initial.cols),
    mines: String(initial.mines),
  });

  const wynik = ValidateConfig({
    rows: NaLiczbe(values.rows),
    cols: NaLiczbe(values.cols),
    mines: NaLiczbe(values.mines),
  });

  const Wyslij = (event: FormEvent) => {
    console.log("wlasna plansza", values);
    event.preventDefault();
    wynik.fold(() => undefined, onSubmit);
  };

  return (
    <form onSubmit={Wyslij} noValidate className="mt-4 flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {FIELDS.map(({ name, label, hint }) => (
          <label key={name} className="flex flex-col gap-1 text-sm font-semibold">
            {label}
            <input
              className="input"
              type="number"
              inputMode="numeric"
              name={name}
              value={values[name]}

              onChange={(event) => setValues({ ...values, [name]: event.target.value })}
              aria-describedby="custom-board-message"
            />
            <span className="text-muted text-xs font-normal">{hint}</span>
          </label>
        ))}
      </div>

      <p id="custom-board-message" aria-live="polite" className="min-h-10 text-sm">
        {wynik.fold(
          (error) => (
            <span className="text-danger font-semibold" role="alert">
              {error}
	          </span>
	        ),
          (config) => (
            <span className="text-muted">
              Gęstość min: {GestoscMin(config)}% (najwyżej {MaxMines(config.rows, config.cols)} min na
              tej planszy)
            </span>
          ),
        )}  
      </p>

      <div className="flex justify-end gap-2">
        <Dialog.Close className="btn" type="button">
          Anuluj
        </Dialog.Close>
        <button type="submit" className="btn btn-primary" disabled={wynik.isLeft()}>
          Graj
        </button>
      </div>
    </form>
  );  
}

type DialogProps =  FormProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CustomBoardDialog({ open, onOpenChange, initial, onSubmit }: DialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
         <Dialog.Content className="dialog-content">
          <Dialog.Title className="text-xl font-bold">Własna plansza</Dialog.Title>
            <Dialog.Description className="text-muted mt-1 text-sm">
             Wybierz rozmiar planszy i liczbę min.
          </Dialog.Description>
          <CustomBoardForm initial={initial} onSubmit={onSubmit} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}