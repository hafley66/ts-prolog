import type { Var } from "../../src/01-term";
import type { QueryM } from "../../src/04-machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["app", "nil", Var<"Y">, Var<"Y">]],
  [["app", ["cons", Var<"H">, Var<"T">], Var<"Y">, ["cons", Var<"H">, Var<"R">]], ["app", Var<"T">, Var<"Y">, Var<"R">]],
  [["nrev", "nil", "nil"]],
  [
    ["nrev", ["cons", Var<"H">, Var<"T">], Var<"R">],
    ["nrev", Var<"T">, Var<"RT">],
    ["app", Var<"RT">, ["cons", Var<"H">, "nil"], Var<"R">],
  ],
];
export type Out = QueryM<["nrev", ["cons", "e1", ["cons", "e2", ["cons", "e3", ["cons", "e4", ["cons", "e5", ["cons", "e6", "nil"]]]]]], Var<"R">], DB>;
