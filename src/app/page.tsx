import { Game } from "@/components/Game";

export default function Home() {
  return (
    <main className="flex flex-col items-center gap-4 p-4">
      <h1 className="sr-only">Saper</h1>
      <Game />
    </main>
  );
}
