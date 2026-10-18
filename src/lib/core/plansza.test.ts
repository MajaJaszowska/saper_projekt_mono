import { expect, test } from "vitest";
import {LosujMiny} from "./mines";
import { Neigbours } from "./plansza"   

test("liczba min", () => {
  const plansza = LosujMiny({ rows: 9, cols: 9, mines: 10 }, 123, [{ row: 0, col: 0 }]);
  let ile       = 0;
  plansza.forEach((w) =>  w.forEach((p) =>  (p.mine ? ile++ : null)));
  expect(ile).toBe(10);
  expect(plansza[0][0].mine).toBe(false);
});

test("sasiedzi w rogu", () => {
  const s=Neigbours({ rows: 5, cols: 5 }, { row: 0, col: 0 });
  expect(s.length).toBe(3);
 });