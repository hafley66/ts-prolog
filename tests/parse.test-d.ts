import type { Var } from "../src/01-term";
import type { Clause, Term, Query } from "../src/05-parse";
import type { Equal, Expect } from "./util";

type _atom = Expect<Equal<Term<"tom">, "tom">>;
type _var = Expect<Equal<Term<"X">, Var<"X">>>;
type _underscore = Expect<Equal<Term<"_G">, Var<"_G">>>;
type _compound = Expect<
  Equal<Term<"parent(tom, X)">, ["parent", "tom", Var<"X">]>
>;
type _nested = Expect<
  Equal<Term<"f(g(X), h(a, b))">, ["f", ["g", Var<"X">], ["h", "a", "b"]]>
>;

type _empty_list = Expect<Equal<Term<"[]">, "nil">>;
type _list = Expect<
  Equal<Term<"[a, b]">, ["cons", "a", ["cons", "b", "nil"]]>
>;
type _list_tail = Expect<
  Equal<Term<"[H|T]">, ["cons", Var<"H">, Var<"T">]>
>;
type _list_nested = Expect<
  Equal<
    Term<"[f(X), [a]|T]">,
    ["cons", ["f", Var<"X">], ["cons", ["cons", "a", "nil"], Var<"T">]]
  >
>;

type _fact = Expect<Equal<Clause<"parent(tom, bob)">, [["parent", "tom", "bob"]]>>;
type _rule = Expect<
  Equal<
    Clause<"anc(X, Z) :- par(X, Y), anc(Y, Z)">,
    [["anc", Var<"X">, Var<"Z">], ["par", Var<"X">, Var<"Y">], ["anc", Var<"Y">, Var<"Z">]]
  >
>;
type _cut_clause = Expect<
  Equal<Clause<"once(G) :- G, !">, [["once", Var<"G">], Var<"G">, "!"]>
>;

// the whole family suite, written as Prolog source
type FamilySrc = [
  "parent(tom, bob)",
  "parent(tom, liz)",
  "parent(bob, ann)",
  "parent(bob, pat)",
  "grandparent(X, Z) :- parent(X, Y), parent(Y, Z)",
  "ancestor(X, Y) :- parent(X, Y)",
  "ancestor(X, Z) :- parent(X, Y), ancestor(Y, Z)",
];

type _grandparent = Expect<
  Equal<
    Query<"grandparent(tom, Who)", FamilySrc>,
    [["grandparent", "tom", "ann"], ["grandparent", "tom", "pat"]]
  >
>;
type _ancestor = Expect<
  Equal<
    Query<"ancestor(A, ann)", FamilySrc>,
    [["ancestor", "bob", "ann"], ["ancestor", "tom", "ann"]]
  >
>;

// cut + NAF through the string surface
type NafSrc = [
  "not(G) :- G, !, fail",
  "not(G2)",
  "male(bob)",
  "male(tim)",
  "married(bob)",
  "bachelor(X) :- male(X), not(married(X))",
];
type _naf = Expect<
  Equal<Query<"bachelor(B)", NafSrc>, [["bachelor", "tim"]]>
>;

// append in real Prolog notation, run backwards
type AppSrc = [
  "app([], Y, Y)",
  "app([H|T], Y, [H|R]) :- app(T, Y, R)",
];
type _splits = Expect<
  Equal<
    Query<"app(A, B, [x, y])", AppSrc>,
    [
      ["app", "nil", Term<"[x, y]">, Term<"[x, y]">],
      ["app", Term<"[x]">, Term<"[y]">, Term<"[x, y]">],
      ["app", Term<"[x, y]">, "nil", Term<"[x, y]">],
    ]
  >
>;
