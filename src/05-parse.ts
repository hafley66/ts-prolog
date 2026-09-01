import type { Var } from "./01-term";
import type { QueryM } from "./04-machine";

type UpperAlpha =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
  | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";

type Trim<S extends string> = S extends ` ${infer R}` ? Trim<R> : S;

// consume name chars until a delimiter; -> [name, rest]
type ReadName<S extends string, Acc extends string = ""> = S extends
  `${infer C}${infer R}`
  ? C extends "(" | ")" | "," | " " | "[" | "]" | "|"
    ? [Acc, S]
    : ReadName<R, `${Acc}${C}`>
  : [Acc, S];

// prolog convention: initial uppercase or underscore is a variable;
// all-digit names become native number literals
type MkAtomOrVar<N extends string> = N extends `${infer C}${string}`
  ? C extends UpperAlpha | "_"
    ? Var<N>
    : N extends `${infer Num extends number}`
      ? Num
      : N
  : N;

type Rev<
  Ts extends readonly unknown[],
  Acc extends readonly unknown[] = [],
> = Ts extends readonly [infer H, ...infer R] ? Rev<R, [H, ...Acc]> : Acc;

type ConsFold<
  RevElems extends readonly unknown[],
  Tail,
> = RevElems extends readonly [infer H, ...infer R extends readonly unknown[]]
  ? ConsFold<R, ["cons", H, Tail]>
  : Tail;

// shift-reduce term parser: nesting pushes ["A"|"L"|"T", parent, ...] stack
// frames (args / list elems / list |-tail) instead of recursing
type PWC<
  S extends string,
  Cur extends readonly unknown[],
  Stack extends readonly unknown[],
  F extends readonly 0[],
> = F["length"] extends 128
  ? { r: S; c: Cur; s: Stack }
  : Stack extends readonly []
    ? Cur extends readonly [infer T]
      ? [T, S]
      : PWStep<S, Cur, Stack, F>
    : PWStep<S, Cur, Stack, F>;

type PWStep<
  S extends string,
  Cur extends readonly unknown[],
  Stack extends readonly unknown[],
  F extends readonly 0[],
> = Trim<S> extends infer R extends string
  ? R extends `,${infer R2}`
    ? PWC<R2, Cur, Stack, [...F, 0]>
    : R extends `)${infer R2}`
      ? Stack extends readonly [
            readonly ["A", infer PCur extends readonly unknown[]],
            ...infer Pop extends readonly unknown[],
          ]
        ? PWC<R2, [...PCur, Cur], Pop, [...F, 0]>
        : never
      : R extends `]${infer R2}`
        ? Stack extends readonly [
              readonly ["L", infer PCur extends readonly unknown[]],
              ...infer Pop extends readonly unknown[],
            ]
          ? PWC<R2, [...PCur, ConsFold<Rev<Cur>, "nil">], Pop, [...F, 0]>
          : Stack extends readonly [
                readonly [
                  "T",
                  infer PCur extends readonly unknown[],
                  infer Elems extends readonly unknown[],
                ],
                ...infer Pop extends readonly unknown[],
              ]
            ? Cur extends readonly [infer Tail]
              ? PWC<R2, [...PCur, ConsFold<Rev<Elems>, Tail>], Pop, [...F, 0]>
              : never
            : never
        : R extends `|${infer R2}`
          ? Stack extends readonly [
                readonly ["L", infer PCur extends readonly unknown[]],
                ...infer Pop extends readonly unknown[],
              ]
            ? PWC<R2, [], [["T", PCur, Cur], ...Pop], [...F, 0]>
            : never
          : R extends `[${infer R2}`
            ? PWC<R2, [], [["L", Cur], ...Stack], [...F, 0]>
            : ReadName<R> extends [
                  infer Name extends string,
                  infer Rest extends string,
                ]
              ? Rest extends `(${infer R3}`
                ? PWC<R3, [Name], [["A", Cur], ...Stack], [...F, 0]>
                : PWC<Rest, [...Cur, MkAtomOrVar<Name>], Stack, [...F, 0]>
              : never
  : never;

type PWLoop<
  S extends string,
  Cur extends readonly unknown[],
  Stack extends readonly unknown[],
> = PWC<S, Cur, Stack, []> extends infer Res
  ? Res extends {
      r: infer S2 extends string;
      c: infer C2 extends readonly unknown[];
      s: infer St2 extends readonly unknown[];
    }
    ? PWLoop<S2, C2, St2>
    : Res
  : never;

// parse one term; -> [Term, rest]
type PTerm<S extends string> = PWLoop<S, [], []>;

type PBody<S extends string> = PTerm<S> extends [infer T, infer R extends string]
  ? Trim<R> extends `,${infer R2}`
    ? [T, ...PBody<R2>]
    : [T]
  : never;

type P0<S extends string> = PTerm<S> extends readonly [infer T, string] ? T : never;

type RawClause<S extends string> = S extends `${infer H} :- ${infer B}`
  ? [P0<H>, ...PBody<B>]
  : [P0<S>];

// worklist wildcard rename: each bare "_" becomes a distinct clause-scoped
// var; postorder rebuild with explicit stack, fuel-chunked
type RWC<
  In extends readonly unknown[],
  Done extends readonly unknown[],
  Stack extends readonly unknown[],
  C extends readonly 0[],
  F extends readonly 0[],
> = F["length"] extends 512
  ? { i: In; d: Done; s: Stack; c: C }
  : In extends readonly [infer X, ...infer Xs extends readonly unknown[]]
    ? X extends readonly unknown[]
      ? RWC<X, [], [[Xs, Done], ...Stack], C, [...F, 0]>
      : X extends Var<"_">
        ? RWC<Xs, [...Done, Var<`_${C["length"]}`>], Stack, [...C, 0], [...F, 0]>
        : RWC<Xs, [...Done, X], Stack, C, [...F, 0]>
    : Stack extends readonly [
          readonly [
            infer PIn extends readonly unknown[],
            infer PDone extends readonly unknown[],
          ],
          ...infer Rest extends readonly unknown[],
        ]
      ? RWC<PIn, [...PDone, Done], Rest, C, [...F, 0]>
      : [Done, C];

type RWLoop<
  In extends readonly unknown[],
  Done extends readonly unknown[],
  Stack extends readonly unknown[],
  C extends readonly 0[],
> = RWC<In, Done, Stack, C, []> extends infer Res
  ? Res extends {
      i: infer I2 extends readonly unknown[];
      d: infer D2 extends readonly unknown[];
      s: infer S2 extends readonly unknown[];
      c: infer C2 extends readonly 0[];
    }
    ? RWLoop<I2, D2, S2, C2>
    : Res
  : never;

type RenameWild<T> = T extends readonly unknown[]
  ? RWLoop<[T], [], [], []> extends [readonly [infer T2], readonly 0[]]
    ? T2
    : never
  : T extends Var<"_">
    ? Var<"_0">
    : T;

export type Clause<S extends string> = RenameWild<RawClause<S>>;

export type Program<Cs extends readonly string[]> = {
  [K in keyof Cs]: Clause<Cs[K]>;
};

export type Term<S extends string> = RenameWild<P0<S>>;

export type Query<S extends string, Cs extends readonly string[]> = QueryM<
  Term<S>,
  Program<Cs>
>;
