import type { Var } from "./term";
import type { QueryM } from "./machine";

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

// prolog convention: initial uppercase or underscore is a variable
type MkAtomOrVar<N extends string> = N extends `${infer C}${string}`
  ? C extends UpperAlpha | "_"
    ? Var<N>
    : N
  : N;

// parse one term; -> [Term, rest]. Functor "(" must follow the name directly.
type PTerm<S extends string> = Trim<S> extends `[${infer R}`
  ? PList<R>
  : ReadName<Trim<S>> extends [
        infer Name extends string,
        infer Rest extends string,
      ]
    ? Rest extends `(${infer R2}`
      ? PArgs<R2, [Name]>
      : [MkAtomOrVar<Name>, Rest]
    : never;

// [a, b], [H|T], [] -> cons cells / "nil"
type PList<S extends string> = Trim<S> extends `]${infer R}`
  ? ["nil", R]
  : PTerm<S> extends [infer T, infer R extends string]
    ? Trim<R> extends `,${infer R2}`
      ? PList<R2> extends [infer Rest2, infer R3]
        ? [["cons", T, Rest2], R3]
        : never
      : Trim<R> extends `|${infer R2}`
        ? PTerm<R2> extends [infer Tail, infer R3 extends string]
          ? Trim<R3> extends `]${infer R4}`
            ? [["cons", T, Tail], R4]
            : never
          : never
        : Trim<R> extends `]${infer R3}`
          ? [["cons", T, "nil"], R3]
          : never
    : never;

type PArgs<S extends string, Acc extends readonly unknown[]> = PTerm<S> extends [
  infer T,
  infer R extends string,
]
  ? Trim<R> extends `,${infer R2}`
    ? PArgs<R2, [...Acc, T]>
    : Trim<R> extends `)${infer R3}`
      ? [[...Acc, T], R3]
      : never
  : never;

type PBody<S extends string> = PTerm<S> extends [infer T, infer R extends string]
  ? Trim<R> extends `,${infer R2}`
    ? [T, ...PBody<R2>]
    : [T]
  : never;

export type Clause<S extends string> = S extends `${infer H} :- ${infer B}`
  ? [PTerm<H>[0], ...PBody<B>]
  : [PTerm<S>[0]];

export type Program<Cs extends readonly string[]> = {
  [K in keyof Cs]: Clause<Cs[K]>;
};

export type Term<S extends string> = PTerm<S>[0];

export type Query<S extends string, Cs extends readonly string[]> = QueryM<
  Term<S>,
  Program<Cs>
>;
