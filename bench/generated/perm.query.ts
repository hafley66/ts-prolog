import type { Var } from "../../src/01-term";
import type { QueryM } from "../../src/04-machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["sel", Var<"X">, ["cons", Var<"X">, Var<"T">], Var<"T">]],
  [["sel", Var<"X">, ["cons", Var<"H">, Var<"T">], ["cons", Var<"H">, Var<"R">]], ["sel", Var<"X">, Var<"T">, Var<"R">]],
  [["perm", "nil", "nil"]],
  [["perm", Var<"L">, ["cons", Var<"X">, Var<"P">]], ["sel", Var<"X">, Var<"L">, Var<"R">], ["perm", Var<"R">, Var<"P">]],
];
export type Out = QueryM<["perm", ["cons", "a", ["cons", "b", ["cons", "c", ["cons", "d", "nil"]]]], Var<"P">], DB>;
