"use client";

import { sprawdzOdznaki } from "@/lib/core/achievements";
import { useDaneGry } from "./AppProvider";

function BadgeIcon({ unlocked }: { unlocked: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10 shrink-0" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={unlocked ? "var(--accent)" : "var(--surface-2)"}
        stroke={unlocked ? "var(--accent)" : "var(--border)"}
        strokeWidth="1.5"
      />
      {unlocked ? (
        <path d="M7 12.5l3.2 3.200L17 9" fill="none" stroke="var(--accent-text)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <g fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round">
          <rect x="8" y="11" width="8" height="6" rx="1.2" />
          <path d="M9.5 11V9.300a2.500 2.500 0 015 0V11" />
        </g>
      )}
    </svg>
  );
}

export function AchievementsView() {
  const { records, daily } = useDaneGry();
  const statusy = sprawdzOdznaki({ records, daily });
  let unlocked = 0;
  statusy.forEach((s) => {
    if (s.unlocked) unlocked++;
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted">
        Zdobyte odznaki:{" "}
        <strong className="text-ink">
          {unlocked} z {statusy.length}
        </strong>
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {statusy.map(({ achievement, unlocked: isUnlocked }) => (
          <li
            key={achievement.id}
            className={`card flex items-center gap-3 ${isUnlocked ? "border-accent" : "opacity-80"}`}
            data-unlocked={isUnlocked}
          >
            <BadgeIcon unlocked={isUnlocked} />
            <div>
              <div className="font-bold">{achievement.title}</div>
              <div className="text-muted text-sm">{achievement.description}</div>
              <div className="mt-1 text-sm font-semibold">
                {isUnlocked ? "Zdobyta" : "Do zdobycia"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
