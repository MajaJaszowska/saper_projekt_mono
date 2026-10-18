export type Pos = Readonly<{ row: number; col: number }>;

export type Mark = "none" | "flag" | "question";

export type Cell  = Readonly<{
  mine: boolean;
  adjacent: number;
  revealed: boolean;
  mark : Mark;
  }>;
export type Board = ReadonlyArray<ReadonlyArray<Cell>>;

 export type Size = Readonly<{ rows: number; cols: number }>;

export type Config = Readonly<{ rows: number; cols: number; mines: number }>;

export type PresetKey = "beginner" | "intermediate" | "expert" | "custom"

export type Kind="normal" | "code" | "daily"

export type Status = "ready" | "playing" | "won" | "lost"; 

export type RevealResult = Readonly<{
  board: Board;
  hitMine: boolean;
  exploded:Pos | null;
  order: ReadonlyArray<Pos>;
}>;
