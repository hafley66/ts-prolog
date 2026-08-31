import type { Var } from "../../src/01-term";
import type { QueryM } from "../../src/04-machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["diff", "r", "g"]],
  [["diff", "r", "b"]],
  [["diff", "g", "r"]],
  [["diff", "g", "b"]],
  [["diff", "b", "r"]],
  [["diff", "b", "g"]],
  [
    ["col", Var<"WA">, Var<"NT">, Var<"SA">, Var<"Q">, Var<"NSW">, Var<"V">],
    ["diff", Var<"WA">, Var<"NT">], ["diff", Var<"WA">, Var<"SA">], ["diff", Var<"NT">, Var<"SA">], ["diff", Var<"NT">, Var<"Q">], ["diff", Var<"SA">, Var<"Q">], ["diff", Var<"SA">, Var<"NSW">], ["diff", Var<"Q">, Var<"NSW">], ["diff", Var<"NSW">, Var<"V">], ["diff", Var<"SA">, Var<"V">],
  ],
];
export type Out = QueryM<["col", Var<"WA">, Var<"NT">, Var<"SA">, Var<"Q">, Var<"NSW">, Var<"V">], DB>;
