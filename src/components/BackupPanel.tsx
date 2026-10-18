"use client"; 

import { AlertDialog } from 'radix-ui';  
import { type ChangeEvent, useRef, useState } from 'react'
import { GetTime } from '@/lib/client/czas';
import { type Backup, ZrobBackup, ParseBackup } from '@/lib/core/backup';

import { useApp, useDaneGry } from './AppProvider';

export function BackupPanel() {
  const { settings, records, daily, restoreBackup } = useApp();
  const { isDemo } = useDaneGry();
  const [status, setStatus] = useState("idle");
  const [blad, setBlad] = useState("");
  const [dane, setDane] = useState<Backup | null>(null);
  const poleRef = useRef<HTMLInputElement>(null);

  const Eksportuj = () => {
    const backup = ZrobBackup(settings, records, daily, GetTime());
    console.log("eksport", backup.records.length);
    const link = document.createElement("a");
    link.href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backup, null, 2))}`;
    link.download = `saper-kopia-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
  };

  const WybranoPlik = async (event: ChangeEvent<HTMLInputElement>) => {
    const plik = event.target.files?.[0];
    event.target.value = "";
    if (plik === undefined) return;

    setStatus("loading");
    if (plik.size > 1000000) {
      setBlad("Plik jest za duży (limit to 1 MB)")
      setStatus("error");  
      return;
    }
    let tekst=""
    try {
      tekst = await plik.text();
    } catch {
      setBlad("Nie udało się odczytać pliku");
      setStatus("error");
      return;
    }
    ParseBackup(tekst).fold( 
      (error) =>  {
        setBlad(error);
        setStatus("error");
      },
      (data) => {
        setDane(data);
        setStatus("ok");
      },
    );
  };

  const oczekujace = status == "ok" ? dane : null;
  const Zamknij = () => {
    setStatus("idle");
    setDane(null);
  };

  if (isDemo) {
    return (
      <p className="text-muted text-sm">
          Eksport i import są wyłączone w trybie demonstracyjnym, żeby nie pomylić danych testowych z
        prawdziwymi.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={Eksportuj}>
          Eksportuj dane do pliku
        </button>
        <button type="button" className="btn" onClick={() => poleRef.current?.click()}>
          Importuj dane z pliku
        </button>
        <input
          ref={poleRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Plik kopii zapasowej"
          onChange={(event) => void WybranoPlik(event)}
        />
      </div>

      <p className="min-h-5 text-sm" aria-live="polite">
        {status === "loading" && <span className="text-muted">Wczytywanie pliku…</span>}
        {status === "error" && (
          <span className="text-danger font-semibold" role="alert">
            {blad}
          </span>
        )}
      </p>

        <AlertDialog.Root open={oczekujace !== null} onOpenChange={(open) => !open && Zamknij()}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="dialog-overlay" />
          <AlertDialog.Content className="dialog-content">
            <AlertDialog.Title className="text-xl font-bold">Zastąpić obecne dane?</AlertDialog.Title>
            <AlertDialog.Description className="mt-2">
              Plik zawiera {oczekujace?.records.length ?? 0} wyników gier i{" "}
              {oczekujace?.daily.length ?? 0} wyników planszy dnia. Import zastąpi wszystkie obecne
              wyniki ({records.length}) i ustawienia. Tej operacji nie da się cofnąć.
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel className="btn">Anuluj</AlertDialog.Cancel>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (oczekujace !== null) restoreBackup(oczekujace); 
                  Zamknij();
                }}
              >
                Zastąp dane
              </button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
