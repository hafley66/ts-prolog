import type { Var, Subst, Walk, Bind } from "./01-term";

// iterative occurs check: worklist walk, true if var N appears in the term
type Occurs<
  N extends string,
  Stack extends readonly unknown[],
  S extends Subst,
> = Stack extends readonly [infer X, ...infer Xs extends readonly unknown[]]
  ? Walk<X, S> extends infer W
    ? W extends Var<N>
      ? true
      : W extends readonly unknown[]
        ? Occurs<N, [...W, ...Xs], S>
        : Occurs<N, Xs, S>
    : never
  : false;

type BindChecked<N extends string, T, S extends Subst> = Occurs<
  N,
  [T],
  S
> extends true
  ? false
  : Bind<N, T, S>;

// pairwise zip of argument tuples onto the worklist; false on arity clash
type Zip<
  A extends readonly unknown[],
  B extends readonly unknown[],
  Acc extends readonly unknown[],
> = A extends readonly [infer AH, ...infer AT extends readonly unknown[]]
  ? B extends readonly [infer BH, ...infer BT extends readonly unknown[]]
    ? Zip<AT, BT, [...Acc, [AH, BH]]>
    : false
  : B extends readonly [unknown, ...unknown[]]
    ? false
    : Acc;

// worklist unifier: term nesting consumes worklist entries, not instantiation
// depth; fuel-chunked like Run so deep terms pause and resume
type UnifyC<
  W extends readonly unknown[],
  S extends Subst,
  F extends readonly 0[],
> = F["length"] extends 512
  ? { w: W; s: S }
  : W extends readonly [
        readonly [infer A, infer B],
        ...infer Rest extends readonly unknown[],
      ]
    ? Walk<A, S> extends infer WA
      ? Walk<B, S> extends infer WB
      ? WA extends Var<infer N>
        ? WB extends Var<N>
          ? UnifyC<Rest, S, [...F, 0]>
          : BindChecked<N, WB, S> extends infer S2
            ? S2 extends Subst
              ? UnifyC<Rest, S2, [...F, 0]>
              : false
            : never
        : WB extends Var<infer N>
          ? BindChecked<N, WA, S> extends infer S2
            ? S2 extends Subst
              ? UnifyC<Rest, S2, [...F, 0]>
              : false
            : never
          : WA extends string | number
            ? WB extends string | number
              ? WA extends WB
                ? WB extends WA
                  ? UnifyC<Rest, S, [...F, 0]>
                  : false
                : false
              : false
            : WA extends readonly unknown[]
              ? WB extends readonly unknown[]
                ? Zip<WA, WB, []> extends infer Z
                  ? Z extends readonly unknown[]
                    ? UnifyC<[...Z, ...Rest], S, [...F, 0]>
                    : false
                  : never
                : false
              : false
      : never
      : never
    : S;

type UnifyLoop<W extends readonly unknown[], S extends Subst> = UnifyC<
  W,
  S,
  []
> extends infer R
  ? R extends {
      w: infer W2 extends readonly unknown[];
      s: infer S2 extends Subst;
    }
    ? UnifyLoop<W2, S2>
    : R
  : never;

// Subst on success, false on clash; occurs check on every binding
export type Unify<A, B, S extends Subst> = UnifyLoop<[[A, B]], S>;
