import type { IconSet } from "@/lib/core/settings";

type IconProps = Readonly<{ set?: IconSet; className?: string }>;

export function FlagIcon({ set = "classic", className = "cell-icon" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" data-icon={`flag-${set}`}>
      {set === "classic" && (
        <>
          <path d="M7 3v18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M8 4h10l-3 4 3 4H8z" fill="var(--flag)" />
        </>
      )}
      {set === "space" && (
        <path
          d="M12 2.5l2.7 6 6.5.6-4.9 4.4 1.5 6.4L12 16.6 6.2 19.9l1.5-6.4L2.8 9.1l6.5-.6z"
          fill="var(--flag)"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        /> 
      )}
      {set === "garden" && (
        <>
          <path d="M12 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <g fill="var(--flag)" stroke="currentColor" strokeWidth="0.8">
            <circle cx="12" cy="4.6" r="3" />
            <circle cx="16.6" cy="8" r="3" />
            <circle cx="14.8" cy="13.2" r="3" />
            <circle cx="9.2" cy="13.2" r="3" />
            <circle cx="7.4" cy="8" r="3" />
          </g>
          <circle cx="12" cy="9.2" r="2.4" fill="currentColor" />
        </>
      )}
      {set === "minimal" && (
        <>
          <path d="M7 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8.5 4.5L18 8.5l-9.5 4z" fill="var(--flag)" />
        </>
      )}
    </svg>
  );
}

export function MineIcon({ set = "classic", className = "cell-icon" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" data-icon={`mine-${set}`}>
      {set === "classic" && (
        <>
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
          </g>
          <circle cx="12" cy="12" r="6.5" fill="currentColor" />
          <circle cx="9.8" cy="9.8" r="1.6" fill="var(--cell-revealed)" />
        </>
      )}
      {set === "space" && (
        <>
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3l8 8M3 9l5 5M9 3l5 5" />
          </g>
          <circle cx="15.5" cy="15.5" r="6" fill="currentColor" />
          <circle cx="13.6" cy="13.6" r="1.5" fill="var(--cell-revealed)" />
        </>
      )}
      {set === "garden" && (
        <path
          d="M12 1.5l2 5 4.2-3.2-1.2 5.2 5.3.3-4.3 3.2 4.3 3.2-5.3.3 1.2 5.2-4.2-3.2-2 5-2-5-4.2 3.2 1.2-5.2-5.3-.3 4.3-3.2L1.7 8.800l5.3-.3L5.800 3.300 10 6.500z"
          fill="currentColor"
        />
      )}
      {set === "minimal" && <circle cx="12" cy="12" r="6.5" fill="currentColor" />}
    </svg>
  );
}

export function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" className="cell-icon cell-icon-cross" aria-hidden="true">
       <path d="M5 5l14 14M19 5L5 19" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export type Mood = "play" | "press" | "won" | "lost";

const FACE_FILL = "#facc15";
const FACE_INK  = "#1f2937";

function Expression({ mood }: Readonly<{ mood: Mood }>) {
  const stroke = { stroke: FACE_INK, strokeWidth: 1.6, strokeLinecap: "round" as const };   

  return (
    <>
      {mood === "won" && (
        <path
          d="M6.5 9.5h4.5v2.2a2.2 2.2 0 01-4.500 0zM13 9.5h4.5v2.2a2.2 2.2 0 01-4.500 0zM11 10h2"
          fill={FACE_INK}
          {...stroke}
        />
      )}
      {mood === "lost" && (
	      <path d="M7.5 8.5l3 3M10.500 8.500l-3 3M13.500 8.500l3 3M16.500 8.500l-3 3" {...stroke} fill="none" />
      )}
      {(mood === "play" || mood === "press") && (
        <>   
          <circle cx="9" cy="10" r="1.3" fill={FACE_INK} />
          <circle cx="15" cy="10" r="1.3" fill={FACE_INK} />
        </>
      )}
      {(mood === "play" || mood === "won") && (
        <path d="M8 14.2c1.2 1.900 6.800 1.900 8 0" {...stroke} fill="none" />
      )}
      {mood === "press" && <circle cx="12" cy="15.2" r="1.7" fill={FACE_INK} />}
      {mood === "lost" && <path d="M8.5 16.200c1-1.700 6-1.700 7 0" {...stroke} fill="none" />}
    </>
  );
}

type FaceProps = Readonly<{ set?: IconSet; mood: Mood; className?: string }>;   



export function FaceIcon({ set = "classic", mood, className = "face-icon" }: FaceProps) {
  return (
    <svg  
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      data-mood={mood}
      data-icon={`face-${set}`}



    >
      {set === "space" && (
        <ellipse
          cx="12"
          cy="12.5"
          rx="11.3"
          ry="3.4" 
           fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          transform="rotate(-18 12 12.5)"
        />
      )}
      {set === "garden" && (
        <g fill="var(--flag)" stroke="currentColor" strokeWidth="0.6">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((kat) => (
            <circle key={kat} cx="12" cy="3.4" r="3" transform={`rotate(${kat} 12 12)`} />
          ))}
        </g>
      )}
      <circle
        cx="12"
        cy="12"
        r={set === "garden" || set === "space" ? 7.6 : 10}
        fill={set === "minimal" ? "#ffffff" : FACE_FILL}
        stroke={FACE_INK}

        strokeWidth="1.4"
      />
      <g transform={ set === "garden" || set === "space" ? "translate(2.900 2.900) scale(0.76)" : undefined }>
        <Expression mood={mood} />
      </g>
    </svg>
  );
}
