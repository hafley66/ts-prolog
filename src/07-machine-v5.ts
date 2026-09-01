import type { Subst, Var, Walk } from "./01-term";
import type { Unify } from "./02-unify";
import type { Freshen } from "./03-solve";
import type { Arm, Candidates, Diff, Rep, RTerm, Sum, Trunc } from "./04-machine";

// v5 experiment: goals are never rewritten, S is threaded and resolved once
// per answer; builtins limited to plus/lt/neq/$cut until the trade is proven
type Step5<
  Cl,
  G,
  RGoals extends readonly unknown[],
  S extends Subst,
  DB extends readonly unknown[],
  CutN extends number,
> = Cl extends readonly [infer H, ...infer Body extends readonly unknown[]]
  ? Unify<G, H, S> extends infer S2
    ? S2 extends Subst
      ? [[...Arm<Body, CutN>, ...RGoals], S2, "?", DB]
      : false
    : never
  : false;

type ArithBind5<
  Slot,
  V,
  RGoals extends readonly unknown[],
  S extends Subst,
  FDB extends readonly unknown[],
> = V extends number
  ? Unify<Slot, V, S> extends infer S2
    ? S2 extends Subst
      ? [RGoals, S2, "?", FDB]
      : false
    : never
  : false;

// args arrive pre-walked; the unknown slot is a walked (unbound) var
type PlusStep5<
  X,
  Y,
  Z,
  RGoals extends readonly unknown[],
  S extends Subst,
  FDB extends readonly unknown[],
> = X extends number
  ? Y extends number
    ? ArithBind5<Z, Sum<X, Y>, RGoals, S, FDB>
    : Z extends number
      ? ArithBind5<Y, Diff<Z, X>, RGoals, S, FDB>
      : false
  : Y extends number
    ? Z extends number
      ? ArithBind5<X, Diff<Z, Y>, RGoals, S, FDB>
      : false
    : false;

// frame = [Goals, S, Cs | "?", FrameDB]; answers resolve G0 against S
export type Run5<
  CPs extends readonly unknown[],
  Ans extends readonly unknown[],
  G0,
  P extends string,
  C extends readonly 0[],
  F extends readonly 0[],
> = F["length"] extends 512
  ? { p: CPs; a: Ans }
  : CPs extends readonly [infer Top, ...infer Rest extends readonly unknown[]]
    ? Top extends readonly [
        infer Goals extends readonly unknown[],
        infer S extends Subst,
        infer Cs,
        infer FDB extends readonly unknown[],
      ]
      ? Goals extends readonly []
        ? RTerm<[G0], [], [], S> extends readonly [infer AR]
          ? Run5<Rest, [...Ans, AR], G0, P, C, [...F, 0]>
          : never
        : Goals extends readonly [infer Gr, ...infer RGoals extends readonly unknown[]]
          ? Walk<Gr, S> extends infer GW
            ? GW extends readonly ["$cut", infer N extends number]
              ? Run5<[[RGoals, S, "?", FDB], ...Trunc<Rest, N>], Ans, G0, P, C, [...F, 0]>
              : GW extends readonly ["plus", infer X, infer Y, infer Z]
                ? PlusStep5<Walk<X, S>, Walk<Y, S>, Walk<Z, S>, RGoals, S, FDB> extends infer F2
                  ? F2 extends false
                    ? Run5<Rest, Ans, G0, P, C, [...F, 0]>
                    : Run5<[F2, ...Rest], Ans, G0, P, C, [...F, 0]>
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
                        ? Run5<[[RGoals, S, "?", FDB], ...Rest], Ans, G0, P, C, [...F, 0]>
                        : Run5<Rest, Ans, G0, P, C, [...F, 0]>
                      : never
                    : Run5<Rest, Ans, G0, P, C, [...F, 0]>
                  : GW extends readonly ["neq", infer X, infer Y]
                    ? [Walk<X, S>, Walk<Y, S>] extends [
                        infer WX extends string | number,
                        infer WY extends string | number,
                      ]
                      ? [WX, WY] extends [Exclude<WX, Var<string>>, Exclude<WY, Var<string>>]
                        ? WX extends WY
                          ? WY extends WX
                            ? Run5<Rest, Ans, G0, P, C, [...F, 0]>
                            : Run5<[[RGoals, S, "?", FDB], ...Rest], Ans, G0, P, C, [...F, 0]>
                          : Run5<[[RGoals, S, "?", FDB], ...Rest], Ans, G0, P, C, [...F, 0]>
                        : Run5<Rest, Ans, G0, P, C, [...F, 0]>
                      : Run5<Rest, Ans, G0, P, C, [...F, 0]>
                    : (Cs extends "?" ? Candidates<GW, FDB> : Cs) extends infer CsR
                      ? CsR extends readonly [infer Cl, ...infer MoreCs]
                        ? Step5<
                            Freshen<Cl, `${P}${C["length"]}x${F["length"]}`>,
                            GW,
                            RGoals,
                            S,
                            FDB,
                            Rest["length"]
                          > extends infer F2
                          ? F2 extends false
                            ? Run5<[[Goals, S, MoreCs, FDB], ...Rest], Ans, G0, P, C, [...F, 0]>
                            : Run5<[F2, [Goals, S, MoreCs, FDB], ...Rest], Ans, G0, P, C, [...F, 0]>
                          : never
                        : Run5<Rest, Ans, G0, P, C, [...F, 0]>
                      : never
            : never
          : never
      : never
    : Ans;

export type RunLoop5<
  CPs extends readonly unknown[],
  Ans extends readonly unknown[],
  G0,
  P extends string,
  C extends readonly 0[],
> = Run5<CPs, Ans, G0, P, C, []> extends infer R
  ? R extends {
      p: infer CPs2 extends readonly unknown[];
      a: infer Ans2 extends readonly unknown[];
    }
    ? RunLoop5<CPs2, Ans2, G0, P, [...C, 0]>
    : R extends readonly unknown[]
      ? R
      : never
  : never;

export type QueryM5<G, DB extends readonly unknown[]> = RunLoop5<
  [[[G], {}, "?", DB]],
  [],
  G,
  "",
  []
>;
