// hover any alias to watch the checker solve it
import type { Query } from "../src/parse";
import type { Prelude } from "../src/prelude";

type Family = [
  ...Prelude,
  "parent(tom, bob)",
  "parent(tom, liz)",
  "parent(bob, ann)",
  "ancestor(X, Y) :- parent(X, Y)",
  "ancestor(X, Z) :- parent(X, Y), ancestor(Y, Z)",
  "kids(P, L, N) :- findall(K, parent(P, K), L), length(L, N)",
];

type Ancestors = Query<"ancestor(A, ann)", Family>;
type KidCount = Query<"kids(tom, L, N)", Family>;
type Splits = Query<"append(A, B, [1, 2, 3])", Prelude>;
type Sum = Query<"plus(19, 23, S)", []>;
type WhichAddend = Query<"plus(X, 23, 42)", []>;
type Bachelors = Query<
  "bachelor(B)",
  [...Prelude, "male(bob)", "male(tim)", "married(bob)", "bachelor(X) :- male(X), not(married(X))"]
>;

export type { Ancestors, KidCount, Splits, Sum, WhichAddend, Bachelors };
