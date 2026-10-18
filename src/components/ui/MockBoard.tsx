export function SzareLinie({ lines = 3 }: { lines?: number }) {
  return (
    <div className="flex w-full flex-col gap-2" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton h-4" style={{ width: `${90 - i * 15}%` }} />   
      ))}
    </div>
  );
}

export function MockBoard() {
  return (   
    <div className="flex flex-col items-center gap-4" role="status" aria-label="Wczytywanie gry">
      <div className="skeleton h-10 w-72 max-w-full" />
	    <div className="card flex flex-col items-center gap-3">
        <div className="skeleton h-12 w-72 max-w-full" />
        <div className="skeleton h-72 w-72 max-w-full" />
      </div>
      <div className="w-72 max-w-full">
        <SzareLinie lines={2} />
      </div>   
    </div>
  );

 }
