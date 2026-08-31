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
type Out = QueryM<["col", Var<"WA">, Var<"NT">, Var<"SA">, Var<"Q">, Var<"NSW">, Var<"V">], DB>;
type Want = [
  ["col", "r", "g", "b", "r", "g", "r"],
  ["col", "r", "b", "g", "r", "b", "r"],
  ["col", "g", "r", "b", "g", "r", "g"],
  ["col", "g", "b", "r", "g", "b", "g"],
  ["col", "b", "r", "g", "b", "r", "b"],
  ["col", "b", "g", "r", "b", "g", "b"],
];
type _match = Expect<Equal<Out, Want>>;
