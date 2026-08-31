import type { Var } from "../src/01-term";
import type { QueryM } from "../src/04-machine";
import type { Query, Term } from "../src/05-parse";
import type { Prelude } from "../src/06-prelude";
import type { Equal, Expect } from "./util";

type Src = [...Prelude, "birthday(A, B) :- plus(A, 1, B)"];

// numbers parse as native literals, all three plus modes work
type _num_parse = Expect<Equal<Term<"f(42)">, ["f", 42]>>;
type _fwd = Expect<Equal<Query<"plus(2, 3, S)", Src>, [["plus", 2, 3, 5]]>>;
type _back1 = Expect<Equal<Query<"plus(X, 3, 5)", Src>, [["plus", 2, 3, 5]]>>;
type _back2 = Expect<Equal<Query<"plus(2, X, 5)", Src>, [["plus", 2, 3, 5]]>>;
type _check_ok = Expect<Equal<Query<"plus(2, 3, 5)", Src>["length"], 1>>;
type _check_bad = Expect<Equal<Query<"plus(2, 3, 6)", Src>, []>>;
type _underflow = Expect<Equal<Query<"plus(X, 9, 5)", Src>, []>>;
type _rule = Expect<
  Equal<Query<"birthday(41, B)", Src>, [["birthday", 41, 42]]>
>;

type _lt = Expect<Equal<QueryM<["lt", 3, 5], []>["length"], 1>>;
type _lt_eq = Expect<Equal<QueryM<["lt", 5, 5], []>, []>>;
type _lt_gt = Expect<Equal<QueryM<["lt", 7, 5], []>, []>>;

// prelude length/2 bridges lists to native numbers through plus
type _len = Expect<
  Equal<Query<"length([a, b, c], N)", Prelude>, [["length", Term<"[a, b, c]">, 3]]>
>;

// wildcards are distinct vars: pairs(X, Y) matches without cross-binding
type WildSrc = [...Prelude, "second(X) :- member(p(_, X), [p(a, one), p(b, two)])"];
type _wild = Expect<
  Equal<
    Query<"second(W)", WildSrc>,
    [["second", "one"], ["second", "two"]]
  >
>;
