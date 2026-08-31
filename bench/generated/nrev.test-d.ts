import type { Var } from "../../src/term";
import type { QueryM } from "../../src/machine";
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
type Out = QueryM<["nrev", ["cons", "e1", ["cons", "e2", ["cons", "e3", ["cons", "e4", ["cons", "e5", ["cons", "e6", "nil"]]]]]], Var<"R">], DB>;
type Want = [
  ["nrev", ["cons", "e1", ["cons", "e2", ["cons", "e3", ["cons", "e4", ["cons", "e5", ["cons", "e6", "nil"]]]]]], ["cons", "e6", ["cons", "e5", ["cons", "e4", ["cons", "e3", ["cons", "e2", ["cons", "e1", "nil"]]]]]]],
];
type _match = Expect<Equal<Out, Want>>;
