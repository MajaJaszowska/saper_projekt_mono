import type { Metadata } from "next";
import {SettingsView} from '@/components/SettingsView';


export const metadata: Metadata  = { title: "Ustawienia | Saper" };

export default function SettingsPage(){
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Ustawienia</h1>
      <SettingsView />
    </main>
  );
}