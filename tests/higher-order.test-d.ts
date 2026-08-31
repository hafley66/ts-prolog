import type { Var } from "../src/01-term";
import type { QueryM } from "../src/04-machine";
import type { Distinct } from "../src/index";
import type { Equal, Expect } from "./util";

type F = Var<"F">;
type H = Var<"H">;
type T = Var<"T">;
type H2 = Var<"H2">;
type T2 = Var<"T2">;

// the goal [F, H, H2] has a VAR in functor position; once F is bound to
// "succ" the substituted tuple is an ordinary goal
type DB = [
  [["succ", 1, 2]],
  [["succ", 2, 3]],
  [["succ", 3, 4]],
  [["maplist", F, "nil", "nil"]],
  [
    ["maplist", F, ["cons", H, T], ["cons", H2, T2]],
    [F, H, H2],
    ["maplist", F, T, T2],
  ],
];

type L123 = ["cons", 1, ["cons", 2, ["cons", 3, "nil"]]];
type L234 = ["cons", 2, ["cons", 3, ["cons", 4, "nil"]]];

type _map = Expect<
  Equal<
    QueryM<["maplist", "succ", L123, Var<"Out">], DB>,
    [["maplist", "succ", L123, L234]]
  >
>;

// backwards: which function maps [1,2,3] to [2,3,4]? unification names it
type _which = Expect<
  Equal<
    QueryM<["maplist", Var<"Fn">, L123, L234], DB>,
    [["maplist", "succ", L123, L234]]
  >
>;

// setof-lite: Distinct dedupes a solutions tuple
type _distinct = Expect<
  Equal<Distinct<[["p", "a"], ["p", "b"], ["p", "a"]]>, [["p", "a"], ["p", "b"]]>
>;
type _distinct_empty = Expect<Equal<Distinct<[]>, []>>;
