export type TableColumn = Readonly<{
  header: string;
  numeric?: boolean;
}>;

export type TableRow = Readonly<{
  id: string;
  cells: ReadonlyArray<string | number>;
}>;

type Props = Readonly<{
  caption: string;
  intro?: string;
  columns: ReadonlyArray<TableColumn>;
  rows: ReadonlyArray<TableRow>;
}>;

export function DataTable({ caption, intro, columns, rows }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {intro !== undefined && <p className="text-muted text-sm">{intro}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <caption className="pb-2 text-left font-semibold whitespace-normal">{caption}</caption>
          <thead>
            <tr className="text-muted">
              {columns.map((kolumna) => (
                <th
                  key={kolumna.header}
                  scope="col"
                  className={`py-1 pr-3 font-semibold ${kolumna.numeric ? "text-right" : ""}`}
                >
                  {kolumna.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-line border-t">
                {row.cells.map((cell, index) =>
                  index === 0 ? (
                    <th
                      key={index}
                      scope="row"
                      className={`py-1 pr-3 font-semibold tabular-nums ${columns[index]?.numeric ? "text-right" : ""}`}
                    >
                      {cell}
                    </th>
                  ) : (
                    <td
                      key={index}
                      className={`py-1 pr-3 tabular-nums ${columns[index]?.numeric ? "text-right" : ""}`}
                    >
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
