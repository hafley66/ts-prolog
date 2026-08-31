import type { Var, Subst, Walk, Bind } from "./term";

// Subst on success, false on clash. No occurs check.
export type Unify<A, B, S extends Subst> = UnifyW<Walk<A, S>, Walk<B, S>, S>;

type UnifyW<A, B, S extends Subst> = A extends Var<infer N>
  ? B extends Var<N>
    ? S
    : Bind<N, B, S>
  : B extends Var<infer N>
    ? Bind<N, A, S>
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
