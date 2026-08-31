import type { Var } from "../src/term";
import type { Query } from "../src/solve";
import type { Equal, Expect } from "./util";

// peano numerals: "z" / ["s", N]
type N0 = "z";
type N1 = ["s", N0];
type N2 = ["s", N1];
type N3 = ["s", N2];
type N4 = ["s", N3];

type DB = [
  [["add", "z", Var<"Y">, Var<"Y">]],
  [
    ["add", ["s", Var<"X">], Var<"Y">, ["s", Var<"Z">]],
    ["add", Var<"X">, Var<"Y">, Var<"Z">],
  ],
  [["mul", "z", Var<"Y">, "z"]],
  [
    ["mul", ["s", Var<"X">], Var<"Y">, Var<"Z">],
    ["mul", Var<"X">, Var<"Y">, Var<"W">],
    ["add", Var<"W">, Var<"Y">, Var<"Z">],
  ],
];

type _add = Expect<
  Equal<Query<["add", N2, N2, Var<"Sum">], DB>, [["add", N2, N2, N4]]>
>;

// backward: enumerate every pair summing to 2
type _pairs = Expect<
  Equal<
    Query<["add", Var<"A">, Var<"B">, N2], DB>,
    [["add", N0, N2, N2], ["add", N1, N1, N2], ["add", N2, N0, N2]]
  >
>;

type _mul = Expect<
  Equal<Query<["mul", N2, N2, Var<"P">], DB>, [["mul", N2, N2, N4]]>
>;
