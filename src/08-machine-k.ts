import type { Subst, Var, Walk } from "./01-term";
import type { Unify } from "./02-unify";
import type { Freshen } from "./03-solve";
import type { Arm, Candidates, Diff, Rep, RTerm, Sum, Trunc } from "./04-machine";

// v6 experiment: v5 structure sharing, plus a per-branch compaction every K
// steps (goals + answer rewritten against S, S discarded); K sweeps v4<->v5
type StepK<
  Cl,
  G,
  RGoals extends readonly unknown[],
  A,
  S extends Subst,
  DB extends readonly unknown[],
  CutN extends number,
  N extends readonly 0[],
> = Cl extends readonly [infer H, ...infer Body extends readonly unknown[]]
  ? Unify<G, H, S> extends infer S2
    ? S2 extends Subst
      ? [[...Arm<Body, CutN>, ...RGoals], A, S2, "?", DB, [...N, 0]]
      : false
    : never
  : false;

type ArithBindK<
  Slot,
  V,
  RGoals extends readonly unknown[],
  A,
  S extends Subst,
  FDB extends readonly unknown[],
  N extends readonly 0[],
> = V extends number
  ? Unify<Slot, V, S> extends infer S2
    ? S2 extends Subst
      ? [RGoals, A, S2, "?", FDB, [...N, 0]]
      : false
    : never
  : false;

type PlusStepK<
  X,
  Y,
  Z,
  RGoals extends readonly unknown[],
  A,
  S extends Subst,
  FDB extends readonly unknown[],
  N extends readonly 0[],
> = X extends number
  ? Y extends number
    ? ArithBindK<Z, Sum<X, Y>, RGoals, A, S, FDB, N>
    : Z extends number
      ? ArithBindK<Y, Diff<Z, X>, RGoals, A, S, FDB, N>
      : false
  : Y extends number
    ? Z extends number
      ? ArithBindK<X, Diff<Z, Y>, RGoals, A, S, FDB, N>
      : false
    : false;

// frame = [Goals, A, S, Cs | "?", FrameDB, N]; N = steps since last compact
export type RunK<
  CPs extends readonly unknown[],
  Ans extends readonly unknown[],
  K extends number,
  P extends string,
  C extends readonly 0[],
  F extends readonly 0[],
> = F["length"] extends 512
  ? { p: CPs; a: Ans }
  : CPs extends readonly [infer Top, ...infer Rest extends readonly unknown[]]
    ? Top extends readonly [
        infer Goals extends readonly unknown[],
        infer A,
        infer S extends Subst,
        infer Cs,
        infer FDB extends readonly unknown[],
        infer N extends readonly 0[],
      ]
      ? Goals extends readonly []
        ? RTerm<[A], [], [], S> extends readonly [infer AR]
          ? RunK<Rest, [...Ans, AR], K, P, C, [...F, 0]>
          : never
        : N["length"] extends K
          ? RTerm<Goals, [], [], S> extends infer G2 extends readonly unknown[]
            ? RTerm<[A], [], [], S> extends readonly [infer A2]
              ? RunK<[[G2, A2, {}, Cs, FDB, []], ...Rest], Ans, K, P, C, [...F, 0]>
              : never
            : never
          : Goals extends readonly [infer Gr, ...infer RGoals extends readonly unknown[]]
            ? Walk<Gr, S> extends infer GW
              ? GW extends readonly ["$cut", infer CutTo extends number]
                ? RunK<
                    [[RGoals, A, S, "?", FDB, [...N, 0]], ...Trunc<Rest, CutTo>],
                    Ans, K, P, C, [...F, 0]
                  >
                : GW extends readonly ["plus", infer X, infer Y, infer Z]
                  ? PlusStepK<
                      Walk<X, S>, Walk<Y, S>, Walk<Z, S>,
                      RGoals, A, S, FDB, N
                    > extends infer F2
                    ? F2 extends false
                      ? RunK<Rest, Ans, K, P, C, [...F, 0]>
                      : RunK<[F2, ...Rest], Ans, K, P, C, [...F, 0]>
                    : never
                  : GW extends readonly ["lt", infer X, infer Y]
                    ? [Walk<X, S>, Walk<Y, S>] extends [
                        infer WX extends number,
                        infer WY extends number,
                      ]
                      ? [Rep<WX>, Rep<WY>] extends [
                          infer RX extends readonly 0[],
                          infer RY extends readonly 0[],
                        ]
                        ? RY extends readonly [...RX, unknown, ...unknown[]]
                          ? RunK<[[RGoals, A, S, "?", FDB, [...N, 0]], ...Rest], Ans, K, P, C, [...F, 0]>
                          : RunK<Rest, Ans, K, P, C, [...F, 0]>
                        : never
                      : RunK<Rest, Ans, K, P, C, [...F, 0]>
                    : GW extends readonly ["neq", infer X, infer Y]
                      ? [Walk<X, S>, Walk<Y, S>] extends [
                          infer WX extends string | number,
                          infer WY extends string | number,
                        ]
                        ? [WX, WY] extends [Exclude<WX, Var<string>>, Exclude<WY, Var<string>>]
                          ? WX extends WY
                            ? WY extends WX
                              ? RunK<Rest, Ans, K, P, C, [...F, 0]>
                              : RunK<[[RGoals, A, S, "?", FDB, [...N, 0]], ...Rest], Ans, K, P, C, [...F, 0]>
                            : RunK<[[RGoals, A, S, "?", FDB, [...N, 0]], ...Rest], Ans, K, P, C, [...F, 0]>
                          : RunK<Rest, Ans, K, P, C, [...F, 0]>
                        : RunK<Rest, Ans, K, P, C, [...F, 0]>
                      : (Cs extends "?" ? Candidates<GW, FDB> : Cs) extends infer CsR
                        ? CsR extends readonly [infer Cl, ...infer MoreCs]
                          ? StepK<
                              Freshen<Cl, `${P}${C["length"]}x${F["length"]}`>,
                              GW,
                              RGoals,
                              A,
                              S,
                              FDB,
                              Rest["length"],
                              N
                            > extends infer F2
                            ? F2 extends false
                              ? RunK<[[Goals, A, S, MoreCs, FDB, N], ...Rest], Ans, K, P, C, [...F, 0]>
                              : RunK<[F2, [Goals, A, S, MoreCs, FDB, N], ...Rest], Ans, K, P, C, [...F, 0]>
                            : never
                          : RunK<Rest, Ans, K, P, C, [...F, 0]>
                        : never
              : never
            : never
      : never
    : Ans;

export type RunLoopK<
  CPs extends readonly unknown[],
  Ans extends readonly unknown[],
  K extends number,
  P extends string,
  C extends readonly 0[],
> = RunK<CPs, Ans, K, P, C, []> extends infer R
  ? R extends {
      p: infer CPs2 extends readonly unknown[];
      a: infer Ans2 extends readonly unknown[];
    }
    ? RunLoopK<CPs2, Ans2, K, P, [...C, 0]>
    : R extends readonly unknown[]
      ? R
      : never
  : never;

export type QueryMK<G, DB extends readonly unknown[], K extends number> = RunLoopK<
  [[[G], G, {}, "?", DB, []]],
  [],
  K,
  "",
  []
>;
