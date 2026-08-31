import type { Var } from "../src/term";
import type { QueryM } from "../src/machine";
import type { Unify } from "../src/unify";
import type { Equal, Expect } from "./util";

type X = Var<"X">;
type Y = Var<"Y">;
type G = Var<"G">;

type DB = [
  [["lte", "one", "one"]],
  [["lte", "one", "two"]],
  [["lte", "two", "two"]],
  [["max", X, Y, Y], ["lte", X, Y], "!"],
  [["max", X, Y, X]],
  [["parent", "tom", "bob"]],
  [["parent", "tom", "liz"]],
  [["once", G], G, "!"],
  [["not", G], G, "!", "fail"],
  [["not", G]],
  [["male", "bob"]],
  [["male", "tim"]],
  [["married", "bob"]],
  [["bachelor", X], ["male", X], ["not", ["married", X]]],
];

// without the cut this would also yield max(one,two,one) via clause 2
type _max_committed = Expect<
  Equal<QueryM<["max", "one", "two", Var<"M">], DB>, [["max", "one", "two", "two"]]>
>;
type _max_fallthrough = Expect<
  Equal<QueryM<["max", "two", "one", Var<"M">], DB>, [["max", "two", "one", "two"]]>
>;

// meta-call: the bound goal term is executed after substitution
type _once = Expect<
  Equal<
    QueryM<["once", ["parent", "tom", Var<"C">]], DB>,
    [["once", ["parent", "tom", "bob"]]]
  >
>;

// negation-as-failure is a library: not(G) :- G, !, fail. not(_).
type _naf = Expect<
  Equal<QueryM<["bachelor", Var<"B">], DB>, [["bachelor", "tim"]]>
>;
type _naf_pos = Expect<Equal<QueryM<["not", ["married", "tim"]], DB>["length"], 1>>;
type _naf_neg = Expect<Equal<QueryM<["not", ["married", "bob"]], DB>, []>>;

// occurs check: X = f(X) fails instead of hanging Walk
type _occurs = Expect<Equal<Unify<Var<"X">, ["f", Var<"X">], {}>, false>>;
type _occurs_deep = Expect<
  Equal<Unify<["p", Var<"X">, ["g", Var<"X">]], ["p", Var<"Q">, Var<"Q">], {}>, false>
>;
