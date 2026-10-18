"use client";

import Link from 'next/link';
import {usePathname} from 'next/navigation';   
import { NAZWY_MOTYWOW, type Theme } from '@/lib/core/settings'
import { useApp2 } from './AppProvider';
import { MineIcon } from './ui/icons';

const LINKS = [
  { href: "/", label: "Graj" },
  { href: "/stats/", label: "Statystyki" },
  { href: "/achievements/", label: "Odznaki" },
  { href: "/settings/", label: "Ustawienia" },   
];

const LICZBA_LINKOW = 4;

export function Nav() {
  const pathname = usePathname();
  const app = useApp2();

  return (
    <header className="border-line bg-surface border-b">
	    <nav
        aria-label="Główna nawigacja"
        className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-2"
      >
        <span className="mr-auto flex items-center gap-1.5 text-lg font-bold">
          <MineIcon set={app?.settings.iconSet} className="inline-icon" /> Saper
        </span>
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="btn"
            aria-current={pathname.replace(/\/$/, "") === href.replace(/\/$/, "") ? "page" : undefined}
          >  
            {label}
          </Link>
        ))}  
        {app !== null && (
          <button
            type="button"
            className="btn"
            aria-label={`Tryb strony: ${NAZWY_MOTYWOW[app.settings.theme]}. Zmień`} 
            title="Zmień tryb strony: jasny, ciemny, systemowy" 
            onClick={() => {
              let next: Theme = "light";
              if (app.settings.theme === "light") next = "dark";
              else if (app.settings.theme === "dark") next = "system";
              console.log("motyw", next);
              app.dispatchSettings({ type: "SET_THEME", theme: next });
            }}
          >
            {NAZWY_MOTYWOW[app.settings.theme]}
          </button>
        )}
      </nav>
    </header>
  );
}
