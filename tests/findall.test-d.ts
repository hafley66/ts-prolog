import type { Var } from "../src/01-term";
import type { QueryM } from "../src/04-machine";
import type { Query, Term } from "../src/05-parse";
import type { Equal, Expect } from "./util";

type Src = [
  "parent(tom, bob)",
  "parent(tom, liz)",
  "parent(bob, ann)",
  "len([], z)",
  "len([H|T], s(N)) :- len(T, N)",
  "kids(P, L) :- findall(X, parent(P, X), L)",
  "nkids(P, N) :- findall(X, parent(P, X), L), len(L, N)",
];

type _collect = Expect<
  Equal<
    Query<"kids(tom, L)", Src>,
    [["kids", "tom", Term<"[bob, liz]">]]
  >
>;

// no solutions collects the empty list instead of failing
type _empty = Expect<
  Equal<Query<"kids(liz, L)", Src>, [["kids", "liz", "nil"]]>
>;

// second-order + relational arithmetic: count solutions into a peano numeral
type _count = Expect<
  Equal<Query<"nkids(tom, N)", Src>, [["nkids", "tom", ["s", ["s", "z"]]]]>
>;
type _count_deep = Expect<
  Equal<Query<"nkids(bob, N)", Src>, [["nkids", "bob", ["s", "z"]]]>
>;

// copy semantics match SWI: a free goal var is NOT aliased into the answers.
// SWI: findall(X, mem2(X,[Y,b]), L), Y = a  ~>  L = [_G, b], first elem free.
// The sub-derivation freshens Y, so the collected element is that fresh var
// (name = freshen suffix at the findall's chunk/fuel position), and the later
// Y = a binding cannot reach it.
type AliasDB = [
  [["mem2", Var<"X">, ["cons", Var<"X">, Var<"T">]]],
  [["mem2", Var<"X">, ["cons", Var<"H">, Var<"T">]], ["mem2", Var<"X">, Var<"T">]],
  [["eq", Var<"E">, Var<"E">]],
  [
    ["alias", Var<"Y">, Var<"L">],
    ["findall", Var<"X">, ["mem2", Var<"X">, ["cons", Var<"Y">, ["cons", "b", "nil"]]], Var<"L">],
    ["eq", Var<"Y">, "a"],
  ],
];
type _copy_semantics = Expect<
  Equal<
    QueryM<["alias", Var<"Y">, Var<"L">], AliasDB>,
    [["alias", "a", ["cons", Var<"X.0x4f0x0">, ["cons", "b", "nil"]]]]
  >
>;

// findall sees the frame-local DB: asserted facts are collected
type DynSrc = [
  "boot(L) :- assertz(f(a)), assertz(f(b)), findall(X, f(X), L)",
];
type _dynamic = Expect<
  Equal<Query<"boot(L)", DynSrc>, [["boot", Term<"[a, b]">]]>
>;
