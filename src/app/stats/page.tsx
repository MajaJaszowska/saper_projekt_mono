import type { Metadata } from "next";
 import { StatsView } from "@/components/stats/StatsView"; 

export const metadata: Metadata = { title: "Statystyki | Saper" };

export default function StatsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Statystyki</h1>  
      <StatsView />
    </main>
  );
}
