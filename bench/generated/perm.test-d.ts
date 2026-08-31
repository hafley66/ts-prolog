import type { Var } from "../../src/term";
import type { QueryM } from "../../src/machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["sel", Var<"X">, ["cons", Var<"X">, Var<"T">], Var<"T">]],
  [["sel", Var<"X">, ["cons", Var<"H">, Var<"T">], ["cons", Var<"H">, Var<"R">]], ["sel", Var<"X">, Var<"T">, Var<"R">]],
  [["perm", "nil", "nil"]],
  [["perm", Var<"L">, ["cons", Var<"X">, Var<"P">]], ["sel", Var<"X">, Var<"L">, Var<"R">], ["perm", Var<"R">, Var<"P">]],
];
type Out = QueryM<["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], Var<"P">], DB>;
type Want = [
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "a", ["cons", "b", ["cons", "d", ["cons", "c", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "a", ["cons", "c", ["cons", "b", ["cons", "d", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "a", ["cons", "c", ["cons", "d", ["cons", "b", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "a", ["cons", "d", ["cons", "b", ["cons", "c", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "a", ["cons", "d", ["cons", "c", ["cons", "b", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "b", ["cons", "a", ["cons", "c", ["cons", "d", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "b", ["cons", "a", ["cons", "d", ["cons", "c", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "b", ["cons", "c", ["cons", "a", ["cons", "d", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "b", ["cons", "c", ["cons", "d", ["cons", "a", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "b", ["cons", "d", ["cons", "a", ["cons", "c", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "b", ["cons", "d", ["cons", "c", ["cons", "a", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "c", ["cons", "a", ["cons", "b", ["cons", "d", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "c", ["cons", "a", ["cons", "d", ["cons", "b", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "c", ["cons", "b", ["cons", "a", ["cons", "d", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "c", ["cons", "b", ["cons", "d", ["cons", "a", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "c", ["cons", "d", ["cons", "a", ["cons", "b", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "c", ["cons", "d", ["cons", "b", ["cons", "a", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "d", ["cons", "a", ["cons", "b", ["cons", "c", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "d", ["cons", "a", ["cons", "c", ["cons", "b", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "d", ["cons", "b", ["cons", "a", ["cons", "c", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "d", ["cons", "b", ["cons", "c", ["cons", "a", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "d", ["cons", "c", ["cons", "a", ["cons", "b", "nil"]]]]],
  ["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], ["cons", "d", ["cons", "c", ["cons", "b", ["cons", "a", "nil"]]]]],
];
type _match = Expect<Equal<Out, Want>>;
