"use client";
import { Dialog } from "radix-ui";
 import type { IconSet } from "@/lib/core/settings";
import { FaceIcon } from "../ui/icons"

type Props=Readonly<{
	open: boolean;
  onOpenChange: (open: boolean) => void;
   won: boolean;
  iconSet:IconSet;
 timeSec: number;
  levelLabel: string;
 clicks: number;
  note: string | null;

  onNewGame: () => void;
  onSameBoard: (() => void) | null;
}>;

export function ResultDialog({
  open,
  onOpenChange,
  won,
 iconSet,
  timeSec,
  levelLabel,
  clicks,
  note,
  onNewGame,
  onSameBoard,
}: Props){
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="flex items-center gap-2 text-2xl font-bold">
            <FaceIcon set={iconSet} mood={won ? "won" : "lost"} className="h-8 w-8" />
            {won ? "Wygrana!" : "Przegrana"}

          </Dialog.Title>
          <Dialog.Description className="text-muted mt-1">
            {won ? "Wszystkie bezpieczne pola są odkryte." : "To pole kryło minę."}
          </Dialog.Description>
          {note !== null && (
            <p className="text-success mt-3 text-lg font-bold" data-testid="result-note">
              {note}

            </p>
	        )}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
            <dt className="text-muted">Czas</dt>
            <dd className="text-right font-semibold">{timeSec} s</dd>
            <dt className="text-muted">Poziom</dt>
	          <dd className="text-right font-semibold">{levelLabel}</dd>
            <dt className="text-muted">Kliknięcia</dt>
            <dd className="text-right font-semibold">{clicks}</dd>
          </dl>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Dialog.Close className="btn">Zobacz planszę</Dialog.Close>
            {onSameBoard !== null && (
               <button type="button" className="btn" onClick={onSameBoard}>
                Ta sama plansza
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={onNewGame}>
              Nowa gra
            </button>
          </div>  
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );  
}