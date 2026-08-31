export type { Var, Subst } from "./01-term";
export type { Unify } from "./02-unify";
export type { QueryM, Run } from "./04-machine";
export type { Query, Clause, Program, Term as Parse } from "./05-parse";
export type { Prelude } from "./06-prelude";

type Same<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
  ? 1
  : 2
  ? true
  : false;

type Has<Xs extends readonly unknown[], X> = Xs extends readonly [
  infer H,
  ...infer R,
]
  ? Same<H, X> extends true
    ? true
    : Has<R, X>
  : false;

// setof-lite: order-preserving dedupe of a solutions tuple
export type Distinct<
  T extends readonly unknown[],
  Acc extends readonly unknown[] = [],
> = T extends readonly [infer H, ...infer R]
  ? Has<Acc, H> extends true
    ? Distinct<R, Acc>
    : Distinct<R, [...Acc, H]>
  : Acc;
