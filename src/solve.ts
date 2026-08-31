import type { Var, Subst, Walk } from "./term";
import type { Unify } from "./unify";

// standardize apart: clause vars get a per-derivation-depth suffix
export type Freshen<T, D extends string> = T extends Var<infer N>
  ? Var<`${N}.${D}`>
  : T extends readonly unknown[]
    ? { [K in keyof T]: Freshen<T[K], D> }
    : T;

// SLD resolution over an ordered clause list; returns a tuple of substs,
// one per solution, in clause-trial order (= Prolog answer order).
export type Solve<
  Goals extends readonly unknown[],
  S extends Subst,
  DB extends readonly unknown[],
  C extends readonly unknown[],
> = Goals extends readonly [infer G, ...infer Rest]
  ? TryClauses<G, Rest, S, DB, DB, C>
  : [S];

type TryClauses<
  G,
  Rest extends readonly unknown[],
  S extends Subst,
  DB extends readonly unknown[],
  Cs,
  C extends readonly unknown[],
> = Cs extends readonly [infer Cl, ...infer More]
  ? [
      ...TryClause<Freshen<Cl, `${C["length"]}`>, G, Rest, S, DB, C>,
      ...TryClauses<G, Rest, S, DB, More, C>,
    ]
  : [];

type TryClause<
  Cl,
  G,
  Rest extends readonly unknown[],
  S extends Subst,
  DB extends readonly unknown[],
  C extends readonly unknown[],
> = Cl extends readonly [infer H, ...infer Body extends readonly unknown[]]
  ? Unify<G, H, S> extends infer S2
    ? S2 extends Subst
      ? Solve<[...Body, ...Rest], S2, DB, [...C, 0]>
      : []
    : never
  : [];

// apply subst deeply; unbound vars stay as Var<...>
export type Resolve<T, S extends Subst> = Walk<T, S> extends infer W
  ? W extends readonly unknown[]
    ? { -readonly [K in keyof W]: Resolve<W[K], S> }
    : W
  : never;

export type Query<G, DB extends readonly unknown[]> = ResolveAll<
  G,
  Solve<[G], {}, DB, []>
>;

export type ResolveAll<G, Sols> = {
  [K in keyof Sols]: Sols[K] extends Subst ? Resolve<G, Sols[K]> : never;
};
