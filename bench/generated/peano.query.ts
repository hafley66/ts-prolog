import type { Var } from "../../src/01-term";
import type { QueryM } from "../../src/04-machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["add", "z", Var<"Y">, Var<"Y">]],
  [["add", ["s", Var<"X">], Var<"Y">, ["s", Var<"Z">]], ["add", Var<"X">, Var<"Y">, Var<"Z">]],
];
export type Out = QueryM<["add", Var<"A">, Var<"B">, ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]]], DB>;
