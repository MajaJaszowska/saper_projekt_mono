import type { Metadata } from "next";
import { AchievementsView } from "@/components/AchievementsView";

export const metadata: Metadata = { title: "odznaki | Saper" };

export default function AchievementsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Odznaki</h1>
      <AchievementsView />
    </main>
  );
}
