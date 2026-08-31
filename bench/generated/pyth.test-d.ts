import type { Var } from "../../src/01-term";
import type { QueryM } from "../../src/04-machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [
    ["pyth", Var<"X">, Var<"Y">, Var<"Z">],
    ["between", 1, 13, Var<"X">],
    ["between", Var<"X">, 13, Var<"Y">],
    ["times", Var<"X">, Var<"X">, Var<"XX">],
    ["times", Var<"Y">, Var<"Y">, Var<"YY">],
    ["plus", Var<"XX">, Var<"YY">, Var<"ZZ">],
    ["between", Var<"Y">, 20, Var<"Z">],
    ["times", Var<"Z">, Var<"Z">, Var<"ZZ">],
  ],
];
type Out = QueryM<["pyth", Var<"X">, Var<"Y">, Var<"Z">], DB>;
type Want = [
  ["pyth", 3, 4, 5],
  ["pyth", 5, 12, 13],
  ["pyth", 6, 8, 10],
  ["pyth", 9, 12, 15],
];
type _match = Expect<Equal<Out, Want>>;
