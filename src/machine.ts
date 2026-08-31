import type { Subst, Walk } from "./term";
import type { Unify } from "./unify";
import type { Freshen } from "./solve";

// iterative deep-substitute: postorder rebuild with an explicit stack,
// every recursive use is a tail call
type RTerm<
  In extends readonly unknown[],
  Done extends readonly unknown[],
  Stack extends readonly unknown[],
  S extends Subst,
> = In extends readonly [infer X, ...infer Xs extends readonly unknown[]]
  ? Walk<X, S> extends infer W
    ? W extends readonly unknown[]
      ? RTerm<W, [], [[Xs, Done], ...Stack], S>
      : RTerm<Xs, [...Done, W], Stack, S>
    : never
  : Stack extends readonly [
        readonly [
          infer PIn extends readonly unknown[],
          infer PDone extends readonly unknown[],
        ],
        ...infer Rest extends readonly unknown[],
      ]
    ? RTerm<PIn, [...PDone, Done], Rest, S>
    : Done;

// per-step subst is applied to goals + answer then discarded:
// instantiation depth tracks term depth, never derivation length
type Step<
  Cl,
  G,
  RGoals extends readonly unknown[],
  A,
  DB extends readonly unknown[],
> = Cl extends readonly [infer H, ...infer Body extends readonly unknown[]]
  ? Unify<G, H, {}> extends infer S2
    ? S2 extends Subst
      ? RTerm<[[...Body, ...RGoals], A], [], [], S2> extends [
          infer Goals2 extends readonly unknown[],
          infer A2,
        ]
        ? [Goals2, A2, DB]
        : never
      : false
    : never
  : false;

// frame = [Goals, AnswerTerm, RemainingClauses]; CPs is the backtrack stack
export type Run<
  CPs extends readonly unknown[],
  DB extends readonly unknown[],
  Ans extends readonly unknown[],
  K extends readonly unknown[],
> = CPs extends readonly [infer Top, ...infer Rest extends readonly unknown[]]
  ? Top extends readonly [infer Goals extends readonly unknown[], infer A, infer Cs]
    ? Goals extends readonly []
      ? Run<Rest, DB, [...Ans, A], K>
      : Cs extends readonly [infer Cl, ...infer MoreCs]
        ? Goals extends readonly [infer G, ...infer RGoals extends readonly unknown[]]
          ? Step<Freshen<Cl, `${K["length"]}`>, G, RGoals, A, DB> extends infer F
            ? F extends false
              ? Run<[[Goals, A, MoreCs], ...Rest], DB, Ans, [...K, 0]>
              : Run<[F, [Goals, A, MoreCs], ...Rest], DB, Ans, [...K, 0]>
            : never
          : never
        : Run<Rest, DB, Ans, K>
    : never
  : Ans;

export type QueryM<G, DB extends readonly unknown[]> = Run<
  [[[G], G, DB]],
  DB,
  [],
  []
>;
