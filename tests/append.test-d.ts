import type { Var } from "../src/01-term";
import type { Query } from "../src/03-solve";
import type { Equal, Expect } from "./util";

// prolog lists: nil / ["cons", Head, Tail]
type L<T extends readonly unknown[]> = T extends readonly [
  infer H,
  ...infer R,
]
  ? ["cons", H, L<R>]
  : "nil";

type DB = [
  [["append", "nil", Var<"Y">, Var<"Y">]],
  [
    ["append", ["cons", Var<"H">, Var<"T">], Var<"Y">, ["cons", Var<"H">, Var<"R">]],
    ["append", Var<"T">, Var<"Y">, Var<"R">],
  ],
];

type _forward = Expect<
  Equal<
    Query<["append", L<["1"]>, L<["2", "3"]>, Var<"Out">], DB>,
    [["append", L<["1"]>, L<["2", "3"]>, L<["1", "2", "3"]>]]
  >
>;

// run append backwards: enumerate every split of [1,2]
type _splits = Expect<
  Equal<
    Query<["append", Var<"A">, Var<"B">, L<["1", "2"]>], DB>,
    [
      ["append", "nil", L<["1", "2"]>, L<["1", "2"]>],
      ["append", L<["1"]>, L<["2"]>, L<["1", "2"]>],
      ["append", L<["1", "2"]>, "nil", L<["1", "2"]>],
    ]
  >
>;

type _last = Expect<
  Equal<
    Query<["append", Var<"Init">, L<["3"]>, L<["1", "2", "3"]>], DB>,
    [["append", L<["1", "2"]>, L<["3"]>, L<["1", "2", "3"]>]]
  >
>;
