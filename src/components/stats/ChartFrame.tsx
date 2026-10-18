import type { ReactNode } from "react";

type Props = Readonly<{
  title: string;
  description?: string;
  legend: ReadonlyArray<string>;
  table: ReactNode;
  children: ReactNode;
}>;

export function ChartFrame({ title, description, legend, table, children }: Props) {
  return (
    <figure className="card flex flex-col gap-2">
      <figcaption className="font-bold">{title}</figcaption>
      {description !== undefined && <p className="text-muted text-sm">{description}</p>}

      {legend.length > 0 && (
       <ul className="text-muted flex flex-wrap gap-4 text-sm" aria-label="Legenda">
          {legend.map((nazwa, index) => (
            <li key={nazwa} className="flex items-center gap-1.5">
              <span className={`swatch swatch-${index + 1}`} aria-hidden="true" />
              {nazwa}
            </li>
          ))}
        </ul>
	    )}



      {children}
        <details className="text-sm">
        <summary className="text-muted cursor-pointer">Pokaż dane w tabeli</summary>   
         <div className="mt-2">{table}</div>
      </details>
    </figure>
 );
}
