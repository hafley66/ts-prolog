import type { Var } from "../../src/01-term";
import type { QueryM } from "../../src/04-machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["mem2", Var<"X">, ["cons", Var<"X">, Var<"T">]]],
  [["mem2", Var<"X">, ["cons", Var<"H">, Var<"T">]], ["mem2", Var<"X">, Var<"T">]],
  [["mark"], ["mem2", Var<"X">, ["cons", "a", ["cons", "b", ["cons", "c", "nil"]]]], ["assertz", ["saw", Var<"X">]], ["fail"]],
  [["mark"]],
  [["dyn", Var<"L">], ["mark"], ["findall", Var<"X">, ["saw", Var<"X">], Var<"L">]],
];
type Out = QueryM<["dyn", Var<"L">], DB>;
type Want = [
  ["dyn", ["cons", "a", ["cons", "b", ["cons", "c", "nil"]]]],
];
type _match = Expect<Equal<Out, Want>>;
