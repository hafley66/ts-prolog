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

// "!" in a clause body becomes ["$cut", N]: N = stack depth below this
// goal's alternatives, the barrier to truncate back to
type Arm<Body, N extends number> = {
  [K in keyof Body]: Body[K] extends "!" ? ["$cut", N] : Body[K];
};

type Trunc<
  S extends readonly unknown[],
  N extends number,
> = S["length"] extends N
  ? S
  : S extends readonly [unknown, ...infer R extends readonly unknown[]]
    ? Trunc<R, N>
    : S;

// per-step subst is applied to goals + answer then discarded:
// instantiation depth tracks term depth, never derivation length
type Step<
  Cl,
  G,
  RGoals extends readonly unknown[],
  A,
  DB extends readonly unknown[],
  CutN extends number,
> = Cl extends readonly [infer H, ...infer Body extends readonly unknown[]]
  ? Unify<G, H, {}> extends infer S2
    ? S2 extends Subst
      ? RTerm<[[...Arm<Body, CutN>, ...RGoals], A], [], [], S2> extends [
          infer Goals2 extends readonly unknown[],
          infer A2,
        ]
        ? [Goals2, A2, DB, DB]
        : never
      : false
    : never
  : false;

// deterministic retract: remove the first clause whose head unifies,
// apply the head bindings to the continuation
type Retract<
  T,
  Cs,
  Before extends readonly unknown[],
  RGoals extends readonly unknown[],
  A,
  D extends string,
> = Cs extends readonly [
  infer C extends readonly unknown[],
  ...infer More extends readonly unknown[],
]
  ? C extends readonly [infer H, ...unknown[]]
    ? Unify<T, Freshen<H, D>, {}> extends infer S2
      ? S2 extends Subst
        ? RTerm<[RGoals, A], [], [], S2> extends [
            infer G2 extends readonly unknown[],
            infer A2,
          ]
          ? [G2, A2, [...Before, ...More], [...Before, ...More]]
          : never
        : Retract<T, More, [...Before, C], RGoals, A, D>
      : never
    : Retract<T, More, [...Before, C], RGoals, A, D>
  : false;

type ToCons<Xs extends readonly unknown[]> = Xs extends readonly [
  infer H,
  ...infer R,
]
  ? ["cons", H, ToCons<R>]
  : "nil";

// unify the collected solutions with R, then substitute into the continuation
type FindallBind<
  Sols extends readonly unknown[],
  R,
  RGoals extends readonly unknown[],
  A,
  FDB extends readonly unknown[],
> = Unify<R, ToCons<Sols>, {}> extends infer S2
  ? S2 extends Subst
    ? RTerm<[RGoals, A], [], [], S2> extends [
        infer G2 extends readonly unknown[],
        infer A2,
      ]
      ? [G2, A2, FDB, FDB]
      : never
    : false
  : never;

// frame = [Goals, AnswerTerm, RemainingClauses, FrameDB]; frame-local DB
// means backtracking undoes assert/retract (SWI asserts would survive)
export type Run<
  CPs extends readonly unknown[],
  Ans extends readonly unknown[],
  K extends readonly unknown[],
> = CPs extends readonly [infer Top, ...infer Rest extends readonly unknown[]]
  ? Top extends readonly [
      infer Goals extends readonly unknown[],
      infer A,
      infer Cs,
      infer FDB extends readonly unknown[],
    ]
    ? Goals extends readonly []
      ? Run<Rest, [...Ans, A], K>
      : Goals extends readonly [
            ["$cut", infer N extends number],
            ...infer RGoals extends readonly unknown[],
          ]
        ? Run<[[RGoals, A, FDB, FDB], ...Trunc<Rest, N>], Ans, K>
        : Goals extends readonly [
              ["asserta", infer T],
              ...infer RGoals extends readonly unknown[],
            ]
          ? Run<[[RGoals, A, [[T], ...FDB], [[T], ...FDB]], ...Rest], Ans, K>
          : Goals extends readonly [
                ["assertz", infer T],
                ...infer RGoals extends readonly unknown[],
              ]
            ? Run<[[RGoals, A, [...FDB, [T]], [...FDB, [T]]], ...Rest], Ans, K>
            : Goals extends readonly [
                  ["findall", infer T, infer G, infer R],
                  ...infer RGoals extends readonly unknown[],
                ]
              ? Run<[[[G], T, FDB, FDB]], [], [...K, 0]> extends infer Sols extends
                  readonly unknown[]
                ? FindallBind<Sols, R, RGoals, A, FDB> extends infer F
                  ? F extends false
                    ? Run<Rest, Ans, K>
                    : Run<[F, ...Rest], Ans, [...K, 0]>
                  : never
                : never
            : Goals extends readonly [
                  ["retract", infer T],
                  ...infer RGoals extends readonly unknown[],
                ]
              ? Retract<T, FDB, [], RGoals, A, `${K["length"]}`> extends infer F
                ? F extends false
                  ? Run<Rest, Ans, K>
                  : Run<[F, ...Rest], Ans, [...K, 0]>
                : never
              : Cs extends readonly [infer Cl, ...infer MoreCs]
                ? Goals extends readonly [
                      infer G,
                      ...infer RGoals extends readonly unknown[],
                    ]
                  ? Step<
                      Freshen<Cl, `${K["length"]}`>,
                      G,
                      RGoals,
                      A,
                      FDB,
                      Rest["length"]
                    > extends infer F
                    ? F extends false
                      ? Run<[[Goals, A, MoreCs, FDB], ...Rest], Ans, [...K, 0]>
                      : Run<[F, [Goals, A, MoreCs, FDB], ...Rest], Ans, [...K, 0]>
                    : never
                  : never
                : Run<Rest, Ans, K>
    : never
  : Ans;

export type QueryM<G, DB extends readonly unknown[]> = Run<
  [[[G], G, DB, DB]],
  [],
  []
>;
