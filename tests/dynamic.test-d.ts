import type { Var } from "../src/01-term";
import type { QueryM } from "../src/04-machine";
import type { Query } from "../src/05-parse";
import type { Equal, Expect } from "./util";

type X = Var<"X">;

type DB = [
  [["boot", X], ["assertz", ["f", "a"]], ["assertz", ["f", "b"]], ["f", X]],
  [["front", X], ["assertz", ["f", "a"]], ["asserta", ["f", "b"]], ["f", X]],
  [
    ["swap", X],
    ["assertz", ["f", "a"]],
    ["retract", ["f", "a"]],
    ["assertz", ["f", "b"]],
    ["f", X],
  ],
  [["grab", X], ["assertz", ["f", "a"]], ["retract", ["f", X]]],
  [["nofact"], ["retract", ["g", "q"]]],
];

type _assertz_order = Expect<
  Equal<QueryM<["boot", Var<"R">], DB>, [["boot", "a"], ["boot", "b"]]>
>;
type _asserta_front = Expect<
  Equal<QueryM<["front", Var<"R">], DB>, [["front", "b"], ["front", "a"]]>
>;
type _retract_removes = Expect<
  Equal<QueryM<["swap", Var<"R">], DB>, [["swap", "b"]]>
>;
type _retract_binds = Expect<
  Equal<QueryM<["grab", Var<"R">], DB>, [["grab", "a"]]>
>;
type _retract_missing_fails = Expect<Equal<QueryM<["nofact"], DB>, []>>;

// SWI parity: asserts SURVIVE backtracking (global DB threaded in trial
// order); clause 1 asserts then fails, clause 2 sees leftover(x)
type ScopeSrc = [
  "try(X) :- assertz(leftover(x)), fail",
  "try(X) :- leftover(X)",
];
type _backtrack_survives = Expect<
  Equal<Query<"try(W)", ScopeSrc>, [["try", "x"]]>
>;

// memo shape through the string surface
type MemoSrc = [
  "seen(none)",
  "visit(X, Y) :- assertz(mark(X)), retract(mark(Y))",
];
type _surface = Expect<
  Equal<Query<"visit(a, Z)", MemoSrc>, [["visit", "a", "a"]]>
>;
