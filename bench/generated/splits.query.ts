import type { Var } from "../../src/term";
import type { QueryM } from "../../src/machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["append", "nil", Var<"Y">, Var<"Y">]],
  [
    ["append", ["cons", Var<"H">, Var<"T">], Var<"Y">, ["cons", Var<"H">, Var<"R">]],
    ["append", Var<"T">, Var<"Y">, Var<"R">],
  ],
];
export type Out = QueryM<["append", Var<"A">, Var<"B">, ["cons", "e1", ["cons", "e2", ["cons", "e3", ["cons", "e4", ["cons", "e5", ["cons", "e6", ["cons", "e7", ["cons", "e8", "nil"]]]]]]]]], DB>;
