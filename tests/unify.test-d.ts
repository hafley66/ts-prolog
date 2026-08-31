import type { Var, Subst } from "../src/01-term";
import type { Unify } from "../src/02-unify";
import type { Resolve } from "../src/03-solve";
import type { Equal, Expect } from "./util";

type R<T, S> = Resolve<T, Extract<S, Subst>>;

type _atoms_equal = Expect<Equal<Unify<"tom", "tom", {}>, {}>>;
type _atoms_clash = Expect<Equal<Unify<"a", "b", {}>, false>>;

type _bind = Expect<Equal<R<Var<"X">, Unify<Var<"X">, "tom", {}>>, "tom">>;

type _compound = Unify<["f", Var<"X">, "b"], ["f", "a", Var<"Y">], {}>;
type _compound_x = Expect<Equal<R<Var<"X">, _compound>, "a">>;
type _compound_y = Expect<Equal<R<Var<"Y">, _compound>, "b">>;

type _functor_clash = Expect<Equal<Unify<["f", "a"], ["g", "a"], {}>, false>>;
type _arity_clash = Expect<Equal<Unify<["f", "a"], ["f", "a", "b"], {}>, false>>;

type _alias = Unify<Var<"X">, Var<"Y">, {}> extends infer S1 extends Subst
  ? Unify<Var<"X">, "z", S1>
  : never;
type _alias_y = Expect<Equal<R<Var<"Y">, _alias>, "z">>;

type _nested = Unify<
  ["point", ["pair", Var<"A">, "2"]],
  ["point", ["pair", "1", Var<"B">]],
  {}
>;
type _nested_a = Expect<Equal<R<Var<"A">, _nested>, "1">>;
type _nested_b = Expect<Equal<R<Var<"B">, _nested>, "2">>;
