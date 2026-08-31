import type { Var } from "../../src/term";
import type { QueryM } from "../../src/machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["app", "nil", Var<"Y">, Var<"Y">]],
  [["app", ["cons", Var<"H">, Var<"T">], Var<"Y">, ["cons", Var<"H">, Var<"R">]], ["app", Var<"T">, Var<"Y">, Var<"R">]],
  [["hanoi", "z", Var<"F0">, Var<"T0">, Var<"V0">, "nil"]],
  [
    ["hanoi", ["s", Var<"N">], Var<"F">, Var<"T">, Var<"V">, Var<"Ms">],
    ["hanoi", Var<"N">, Var<"F">, Var<"V">, Var<"T">, Var<"M1">],
    ["hanoi", Var<"N">, Var<"V">, Var<"T">, Var<"F">, Var<"M2">],
    ["app", Var<"M1">, ["cons", ["m", Var<"F">, Var<"T">], Var<"M2">], Var<"Ms">],
  ],
];
type Out = QueryM<["hanoi", ["s", ["s", ["s", "z"]]], "a", "c", "b", Var<"Ms">], DB>;
type Want = [
  ["hanoi", ["s", ["s", ["s", "z"]]], "a", "c", "b", ["cons", ["m", "a", "c"], ["cons", ["m", "a", "b"], ["cons", ["m", "c", "b"], ["cons", ["m", "a", "c"], ["cons", ["m", "b", "a"], ["cons", ["m", "b", "c"], ["cons", ["m", "a", "c"], "nil"]]]]]]]],
];
type _match = Expect<Equal<Out, Want>>;
