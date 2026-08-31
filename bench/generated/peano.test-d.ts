import type { Var } from "../../src/term";
import type { QueryM } from "../../src/machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["add", "z", Var<"Y">, Var<"Y">]],
  [["add", ["s", Var<"X">], Var<"Y">, ["s", Var<"Z">]], ["add", Var<"X">, Var<"Y">, Var<"Z">]],
];
type Out = QueryM<["add", Var<"A">, Var<"B">, ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]]], DB>;
type Want = [
  ["add", "z", ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]], ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]]],
  ["add", ["s", "z"], ["s", ["s", ["s", ["s", ["s", "z"]]]]], ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]]],
  ["add", ["s", ["s", "z"]], ["s", ["s", ["s", ["s", "z"]]]], ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]]],
  ["add", ["s", ["s", ["s", "z"]]], ["s", ["s", ["s", "z"]]], ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]]],
  ["add", ["s", ["s", ["s", ["s", "z"]]]], ["s", ["s", "z"]], ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]]],
  ["add", ["s", ["s", ["s", ["s", ["s", "z"]]]]], ["s", "z"], ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]]],
  ["add", ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]], "z", ["s", ["s", ["s", ["s", ["s", ["s", "z"]]]]]]],
];
type _match = Expect<Equal<Out, Want>>;
