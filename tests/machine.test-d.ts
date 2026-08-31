import type { Var } from "../src/term";
import type { QueryM } from "../src/machine";
import type { Equal, Expect } from "./util";

type X = Var<"X">;
type Y = Var<"Y">;
type Z = Var<"Z">;

type FamilyDB = [
  [["parent", "tom", "bob"]],
  [["parent", "tom", "liz"]],
  [["parent", "bob", "ann"]],
  [["parent", "bob", "pat"]],
  [["grandparent", X, Z], ["parent", X, Y], ["parent", Y, Z]],
  [["ancestor", X, Y], ["parent", X, Y]],
  [["ancestor", X, Z], ["parent", X, Y], ["ancestor", Y, Z]],
];

type _grandparent = Expect<
  Equal<
    QueryM<["grandparent", "tom", Var<"Who">], FamilyDB>,
    [["grandparent", "tom", "ann"], ["grandparent", "tom", "pat"]]
  >
>;

type _ancestor_backward = Expect<
  Equal<
    QueryM<["ancestor", Var<"A">, "ann"], FamilyDB>,
    [["ancestor", "bob", "ann"], ["ancestor", "tom", "ann"]]
  >
>;

type L<T extends readonly unknown[]> = T extends readonly [infer H, ...infer R]
  ? ["cons", H, L<R>]
  : "nil";

type AppendDB = [
  [["append", "nil", Var<"Y">, Var<"Y">]],
  [
    ["append", ["cons", Var<"H">, Var<"T">], Var<"Y">, ["cons", Var<"H">, Var<"R">]],
    ["append", Var<"T">, Var<"Y">, Var<"R">],
  ],
];

type _splits = Expect<
  Equal<
    QueryM<["append", Var<"A">, Var<"B">, L<["1", "2"]>], AppendDB>,
    [
      ["append", "nil", L<["1", "2"]>, L<["1", "2"]>],
      ["append", L<["1"]>, L<["2"]>, L<["1", "2"]>],
      ["append", L<["1", "2"]>, "nil", L<["1", "2"]>],
    ]
  >
>;
