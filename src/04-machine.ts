import type { Subst, Var, Walk } from "./01-term";
import type { Unify } from "./02-unify";
import type { Freshen } from "./03-solve";

// iterative deep-substitute: postorder rebuild with an explicit stack,
// every recursive use is a tail call; fuel-chunked like Run
type RTermC<
  In extends readonly unknown[],
  Done extends readonly unknown[],
  Stack extends readonly unknown[],
  S extends Subst,
  F extends readonly 0[],
> = F["length"] extends 512
  ? { i: In; d: Done; s: Stack }
  : In extends readonly [infer X, ...infer Xs extends readonly unknown[]]
    ? Walk<X, S> extends infer W
      ? W extends readonly unknown[]
        ? RTermC<W, [], [[Xs, Done], ...Stack], S, [...F, 0]>
        : RTermC<Xs, [...Done, W], Stack, S, [...F, 0]>
      : never
    : Stack extends readonly [
          readonly [
            infer PIn extends readonly unknown[],
            infer PDone extends readonly unknown[],
          ],
          ...infer Rest extends readonly unknown[],
        ]
      ? RTermC<PIn, [...PDone, Done], Rest, S, [...F, 0]>
      : Done;

type RTerm<
  In extends readonly unknown[],
  Done extends readonly unknown[],
  Stack extends readonly unknown[],
  S extends Subst,
> = RTermC<In, Done, Stack, S, []> extends infer R
  ? R extends {
      i: infer I2 extends readonly unknown[];
      d: infer D2 extends readonly unknown[];
      s: infer S2 extends readonly unknown[];
    }
    ? RTerm<I2, D2, S2, S>
    : R
  : never;

// first-argument indexing: a goal trials only clauses sharing its functor.
// Nonstandard shapes (var functor, var head) stay candidates for Unify
type Functor<G> = G extends readonly [infer F0, ...unknown[]] ? F0 : G;

type Bucket<
  F0,
  Cs extends readonly unknown[],
  Acc extends readonly unknown[],
> = Cs extends readonly [infer Cl, ...infer More extends readonly unknown[]]
  ? Cl extends readonly [readonly [infer HF, ...unknown[]], ...unknown[]]
    ? [HF] extends [F0]
      ? Bucket<F0, More, [...Acc, Cl]>
      : HF extends Var<string>
        ? Bucket<F0, More, [...Acc, Cl]>
        : Bucket<F0, More, Acc>
    : Bucket<F0, More, [...Acc, Cl]>
  : Acc;

type Candidates<G, FDB extends readonly unknown[]> = Functor<G> extends infer F0
  ? F0 extends string | number
    ? Bucket<F0, FDB, []>
    : FDB
  : never;

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
        ? [Goals2, A2, "?", DB]
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
          ? [G2, A2, "?", [...Before, ...More]]
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

type Rep<N extends number, Acc extends readonly 0[] = []> = Acc["length"] extends N
  ? Acc
  : Rep<N, [...Acc, 0]>;

type Sum<A extends number, B extends number> = [...Rep<A>, ...Rep<B>]["length"];

// C - A, or false when A > C
type Diff<C extends number, A extends number> = Rep<C> extends [
  ...Rep<A>,
  ...infer R,
]
  ? R["length"]
  : false;

// A*B by repeated concat of a cached Rep<A>; tail-recursive over B
type MulT<
  RA extends readonly 0[],
  B extends readonly 0[],
  Acc extends readonly 0[],
> = B extends readonly [0, ...infer R extends readonly 0[]]
  ? MulT<RA, R, [...Acc, ...RA]>
  : Acc["length"];

type Mul<A extends number, B extends number> = MulT<Rep<A>, Rep<B>, []>;

// Z / X exact via repeated subtraction; false on remainder, and on X = 0
// (X = 0, Z = 0 admits every Y: fail like SWI's instantiation error)
type DivT<
  RX extends readonly 0[],
  RZ extends readonly 0[],
  Q extends readonly 0[],
> = RZ extends readonly []
  ? Q["length"]
  : RZ extends readonly [...RX, ...infer R extends readonly 0[]]
    ? DivT<RX, R, [...Q, 0]>
    : false;

type DivExact<Z extends number, X extends number> = X extends 0
  ? false
  : DivT<Rep<X>, Rep<Z>, []>;

// unify Slot with the computed value, substitute into the continuation
type ArithBind<
  Slot,
  V,
  RGoals extends readonly unknown[],
  A,
  FDB extends readonly unknown[],
> = V extends number
  ? Unify<Slot, V, {}> extends infer S2
    ? S2 extends Subst
      ? RTerm<[RGoals, A], [], [], S2> extends [
          infer G2 extends readonly unknown[],
          infer A2,
        ]
        ? [G2, A2, "?", FDB]
        : never
      : false
    : never
  : false;

// relational plus/3: any one argument may be the unknown
type PlusStep<
  X,
  Y,
  Z,
  RGoals extends readonly unknown[],
  A,
  FDB extends readonly unknown[],
> = X extends number
  ? Y extends number
    ? ArithBind<Z, Sum<X, Y>, RGoals, A, FDB>
    : Z extends number
      ? ArithBind<Y, Diff<Z, X>, RGoals, A, FDB>
      : false
  : Y extends number
    ? Z extends number
      ? ArithBind<X, Diff<Z, Y>, RGoals, A, FDB>
      : false
    : false;

// relational times/3: any one argument may be the unknown; division is exact
type TimesStep<
  X,
  Y,
  Z,
  RGoals extends readonly unknown[],
  A,
  FDB extends readonly unknown[],
> = X extends number
  ? Y extends number
    ? ArithBind<Z, Mul<X, Y>, RGoals, A, FDB>
    : Z extends number
      ? ArithBind<Y, DivExact<Z, X>, RGoals, A, FDB>
      : false
  : Y extends number
    ? Z extends number
      ? ArithBind<X, DivExact<Z, Y>, RGoals, A, FDB>
      : false
    : false;

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

// frame = [Goals, AnswerTerm, RemainingClauses | "?", FrameDB]; "?" = bucket
// not yet selected, resolved to Candidates on first dispatch; frame-local DB
// means backtracking undoes assert/retract (SWI asserts would survive)
// Fuel F pauses every 512 steps ({p, a} marker); RunLoop restarts the
// checker's per-evaluation tail budget with a fresh chunk
export type Run<
  CPs extends readonly unknown[],
  Ans extends readonly unknown[],
  P extends string,
  C extends readonly 0[],
  F extends readonly 0[],
> = F["length"] extends 512
  ? { p: CPs; a: Ans }
  : CPs extends readonly [infer Top, ...infer Rest extends readonly unknown[]]
  ? Top extends readonly [
      infer Goals extends readonly unknown[],
      infer A,
      infer Cs,
      infer FDB extends readonly unknown[],
    ]
    ? Goals extends readonly []
      ? Run<Rest, [...Ans, A], P, C, [...F, 0]>
      : Goals extends readonly [
            ["$cut", infer N extends number],
            ...infer RGoals extends readonly unknown[],
          ]
        ? Run<[[RGoals, A, "?", FDB], ...Trunc<Rest, N>], Ans, P, C, [...F, 0]>
        : Goals extends readonly [
              ["asserta", infer T],
              ...infer RGoals extends readonly unknown[],
            ]
          ? Run<[[RGoals, A, "?", [[T], ...FDB]], ...Rest], Ans, P, C, [...F, 0]>
          : Goals extends readonly [
                ["assertz", infer T],
                ...infer RGoals extends readonly unknown[],
              ]
            ? Run<[[RGoals, A, "?", [...FDB, [T]]], ...Rest], Ans, P, C, [...F, 0]>
            : Goals extends readonly [
                  ["plus", infer X, infer Y, infer Z],
                  ...infer RGoals extends readonly unknown[],
                ]
              ? PlusStep<X, Y, Z, RGoals, A, FDB> extends infer F2
                ? F2 extends false
                  ? Run<Rest, Ans, P, C, [...F, 0]>
                  : Run<[F2, ...Rest], Ans, P, C, [...F, 0]>
                : never
            : Goals extends readonly [
                  ["lt", infer X extends number, infer Y extends number],
                  ...infer RGoals extends readonly unknown[],
                ]
              ? Rep<Y> extends [...Rep<X>, unknown, ...unknown[]]
                ? Run<[[RGoals, A, "?", FDB], ...Rest], Ans, P, C, [...F, 0]>
                : Run<Rest, Ans, P, C, [...F, 0]>
            : Goals extends readonly [
                  ["neq", infer X extends string | number, infer Y extends string | number],
                  ...infer RGoals extends readonly unknown[],
                ]
              ? X extends Y
                ? Y extends X
                  ? Run<Rest, Ans, P, C, [...F, 0]>
                  : Run<[[RGoals, A, "?", FDB], ...Rest], Ans, P, C, [...F, 0]>
                : Run<[[RGoals, A, "?", FDB], ...Rest], Ans, P, C, [...F, 0]>
            : Goals extends readonly [
                  ["times", infer X, infer Y, infer Z],
                  ...infer RGoals extends readonly unknown[],
                ]
              ? TimesStep<X, Y, Z, RGoals, A, FDB> extends infer F2
                ? F2 extends false
                  ? Run<Rest, Ans, P, C, [...F, 0]>
                  : Run<[F2, ...Rest], Ans, P, C, [...F, 0]>
                : never
            : Goals extends readonly [
                  ["between", infer L extends number, infer H extends number, infer X],
                  ...infer RGoals extends readonly unknown[],
                ]
              ? Rep<H> extends [...Rep<L>, ...unknown[]]
                // force Sum to a literal now: a lazy Sum<Sum<...>> chain in the
                // retry goal deepens instantiation once per generated value
                ? Sum<L, 1> extends infer L2 extends number
                  ? ArithBind<X, L, RGoals, A, FDB> extends infer F2
                    ? F2 extends false
                      ? Run<
                          [[[["between", L2, H, X], ...RGoals], A, "?", FDB], ...Rest],
                          Ans, P, C, [...F, 0]
                        >
                      : Run<
                          [F2, [[["between", L2, H, X], ...RGoals], A, "?", FDB], ...Rest],
                          Ans, P, C, [...F, 0]
                        >
                    : never
                  : never
                : Run<Rest, Ans, P, C, [...F, 0]>
            : Goals extends readonly [
                  ["findall", infer T, infer G, infer R],
                  ...infer RGoals extends readonly unknown[],
                ]
              ? RunLoop<[[[G], T, "?", FDB]], [], `${P}${C["length"]}x${F["length"]}f`, []> extends infer Sols extends
                  readonly unknown[]
                ? FindallBind<Sols, R, RGoals, A, FDB> extends infer F2
                  ? F2 extends false
                    ? Run<Rest, Ans, P, C, [...F, 0]>
                    : Run<[F2, ...Rest], Ans, P, C, [...F, 0]>
                  : never
                : never
            : Goals extends readonly [
                  ["retract", infer T],
                  ...infer RGoals extends readonly unknown[],
                ]
              ? Retract<T, FDB, [], RGoals, A, `${P}${C["length"]}x${F["length"]}`> extends infer F2
                ? F2 extends false
                  ? Run<Rest, Ans, P, C, [...F, 0]>
                  : Run<[F2, ...Rest], Ans, P, C, [...F, 0]>
                : never
              : Goals extends readonly [
                    infer G,
                    ...infer RGoals extends readonly unknown[],
                  ]
                ? (Cs extends "?" ? Candidates<G, FDB> : Cs) extends infer CsR
                  ? CsR extends readonly [infer Cl, ...infer MoreCs]
                    ? Step<
                        Freshen<Cl, `${P}${C["length"]}x${F["length"]}`>,
                        G,
                        RGoals,
                        A,
                        FDB,
                        Rest["length"]
                      > extends infer F2
                      ? F2 extends false
                        ? Run<[[Goals, A, MoreCs, FDB], ...Rest], Ans, P, C, [...F, 0]>
                        : Run<[F2, [Goals, A, MoreCs, FDB], ...Rest], Ans, P, C, [...F, 0]>
                      : never
                    : Run<Rest, Ans, P, C, [...F, 0]>
                  : never
                : never
    : never
  : Ans;

export type RunLoop<
  CPs extends readonly unknown[],
  Ans extends readonly unknown[],
  P extends string,
  C extends readonly 0[],
> = Run<CPs, Ans, P, C, []> extends infer R
  ? R extends {
      p: infer CPs2 extends readonly unknown[];
      a: infer Ans2 extends readonly unknown[];
    }
    ? RunLoop<CPs2, Ans2, P, [...C, 0]>
    : R extends readonly unknown[]
      ? R
      : never
  : never;

export type QueryM<G, DB extends readonly unknown[]> = RunLoop<
  [[[G], G, "?", DB]],
  [],
  "",
  []
>;
