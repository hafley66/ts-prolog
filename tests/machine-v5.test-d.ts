import type { Var } from "../src/01-term";
import type { QueryM5 } from "../src/07-machine-v5";
import type { Equal, Expect } from "./util";

// v5 experiment pins: same answers and answer order as v4 (see 04-machine)
type FamDB = [
  [["par", "tom", "bob"]],
  [["par", "tom", "liz"]],
  [["par", "bob", "ann"]],
  [["anc", Var<"X">, Var<"Y">], ["par", Var<"X">, Var<"Y">]],
  [["anc", Var<"X">, Var<"Z">], ["par", Var<"X">, Var<"Y">], ["anc", Var<"Y">, Var<"Z">]],
];
type _anc = Expect<
  Equal<
    QueryM5<["anc", "tom", Var<"W">], FamDB>,
    [["anc", "tom", "bob"], ["anc", "tom", "liz"], ["anc", "tom", "ann"]]
  >
>;

// cut commits to the first matching clause
type CutDB = [
  [["first", Var<"X">, Var<"L">], ["mem", Var<"X">, Var<"L">], "!"],
  [["mem", Var<"X">, ["cons", Var<"X">, Var<"T">]]],
  [["mem", Var<"X">, ["cons", Var<"H">, Var<"T">]], ["mem", Var<"X">, Var<"T">]],
];
type L = ["cons", "a", ["cons", "b", "nil"]];
type _cut = Expect<
  Equal<QueryM5<["first", Var<"X">, L], CutDB>, [["first", "a", L]]>
>;

// builtins walk their args through the threaded subst
type _plus = Expect<
  Equal<QueryM5<["plus", 2, Var<"Y">, 5], []>, [["plus", 2, 3, 5]]>
>;
type _neq = Expect<Equal<QueryM5<["neq", "a", "a"], []>, []>>;
type _lt = Expect<Equal<QueryM5<["lt", 3, 5], []>["length"], 1>>;
