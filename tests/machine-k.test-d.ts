import type { Var } from "../src/01-term";
import type { QueryMK } from "../src/08-machine-k";
import type { Equal, Expect } from "./util";

// v6 pins: answers and order match v4/v5 at two compaction cadences
type FamDB = [
  [["par", "tom", "bob"]],
  [["par", "tom", "liz"]],
  [["par", "bob", "ann"]],
  [["anc", Var<"X">, Var<"Y">], ["par", Var<"X">, Var<"Y">]],
  [["anc", Var<"X">, Var<"Z">], ["par", Var<"X">, Var<"Y">], ["anc", Var<"Y">, Var<"Z">]],
];
type Want = [["anc", "tom", "bob"], ["anc", "tom", "liz"], ["anc", "tom", "ann"]];
type _anc_k4 = Expect<Equal<QueryMK<["anc", "tom", Var<"W">], FamDB, 4>, Want>>;
type _anc_k64 = Expect<Equal<QueryMK<["anc", "tom", Var<"W">], FamDB, 64>, Want>>;

type CutDB = [
  [["first", Var<"X">, Var<"L">], ["mem", Var<"X">, Var<"L">], "!"],
  [["mem", Var<"X">, ["cons", Var<"X">, Var<"T">]]],
  [["mem", Var<"X">, ["cons", Var<"H">, Var<"T">]], ["mem", Var<"X">, Var<"T">]],
];
type L = ["cons", "a", ["cons", "b", "nil"]];
type _cut = Expect<
  Equal<QueryMK<["first", Var<"X">, L], CutDB, 4>, [["first", "a", L]]>
>;

type _plus = Expect<
  Equal<QueryMK<["plus", 2, Var<"Y">, 5], [], 4>, [["plus", 2, 3, 5]]>
>;
