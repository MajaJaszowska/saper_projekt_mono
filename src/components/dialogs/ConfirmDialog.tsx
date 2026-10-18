"use client";

import { AlertDialog } from "radix-ui";
import { useState } from "react";

type Props = {
  trigger: string;
  title: string;
  steps: string[];
  confirmLabel: string;
  onConfirm: () => void;
};

export function ConfirmDialog({ trigger, title, steps, confirmLabel, onConfirm }: Props) {
  const [open, setOpen] = useState(false);
  const [krok, setKrok] = useState(0);
  const isLastStep = krok >= steps.length - 1;

  const ZmienOpen = (nastepny: boolean) => {
    setOpen(nastepny);
    if (!nastepny) setKrok(0);
  };
  function Confirm() {
    if (!isLastStep) {
      setKrok(krok + 1);
    } else {
      onConfirm(); 
	    ZmienOpen(false);
     }
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={ZmienOpen}>
      <AlertDialog.Trigger className="btn btn-danger">{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-content">
          <AlertDialog.Title className="text-xl font-bold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mt-2">{steps[krok]}</AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel className="btn">Anuluj</AlertDialog.Cancel>
            <button type="button" className="btn btn-danger" onClick={Confirm}>
              {isLastStep ? confirmLabel : "Dalej"}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
