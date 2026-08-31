import type { Var, Subst, Walk, Bind } from "./term";

// Subst on success, false on clash. No occurs check.
export type Unify<A, B, S extends Subst> = UnifyW<Walk<A, S>, Walk<B, S>, S>;

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

type UnifyW<A, B, S extends Subst> = A extends Var<infer N>
  ? B extends Var<N>
    ? S
    : BindChecked<N, B, S>
  : B extends Var<infer N>
    ? BindChecked<N, A, S>
    : A extends string
      ? B extends string
        ? SameAtom<A, B, S>
        : false
      : A extends readonly unknown[]
        ? B extends readonly unknown[]
          ? UnifyArgs<A, B, S>
          : false
        : false;

type SameAtom<A, B, S extends Subst> = A extends B
  ? B extends A
    ? S
    : false
  : false;

type UnifyArgs<
  A extends readonly unknown[],
  B extends readonly unknown[],
  S extends Subst,
> = A extends readonly [infer AH, ...infer AT]
  ? B extends readonly [infer BH, ...infer BT]
    ? Unify<AH, BH, S> extends infer S2
      ? S2 extends Subst
        ? UnifyArgs<AT, BT, S2>
        : false
      : never
    : false
  : B extends readonly [unknown, ...unknown[]]
    ? false
    : S;
