import type { Var } from "../src/01-term";
import type { QueryM } from "../src/04-machine";
import type { Equal, Expect } from "./util";

type L<T extends readonly unknown[]> = T extends readonly [infer H, ...infer R]
  ? ["cons", H, L<R>]
  : "nil";
type UnL<C, Acc extends readonly unknown[] = []> = C extends [
  "cons",
  infer H,
  infer T,
]
  ? UnL<T, [...Acc, H]>
  : Acc;

type DB = [
  [["append", "nil", Var<"Y">, Var<"Y">]],
  [
    ["append", ["cons", Var<"H">, Var<"T">], Var<"Y">, ["cons", Var<"H">, Var<"R">]],
    ["append", Var<"T">, Var<"Y">, Var<"R">],
  ],
];

// 40 elements: 3x past the naive Solve ceiling (n=13)
type Src = ["x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x","x"];
type Out = QueryM<["append", L<Src>, "nil", Var<"O">], DB>;

type _one = Expect<Equal<Out["length"], 1>>;
type _roundtrip = Expect<
  Equal<Out extends [[string, unknown, unknown, infer O]] ? UnL<O> : never, Src>
>;
