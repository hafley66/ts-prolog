// datalog on union types: a relation is a union of [A, B] pairs, so set
// semantics (dedup, no order, no backtracking) come from the checker itself
export type Join<E extends [unknown, unknown], F extends [unknown, unknown]> =
  E extends [infer X, infer Y] ? (F extends [Y, infer Z] ? [X, Z] : never) : never;

// semi-naive transitive closure: only the newest pairs join the base edges
// each round, so a length-n chain costs n * |Delta| * |E| instead of |TC|^2
type TCS<
  Acc extends [unknown, unknown],
  Delta extends [unknown, unknown],
  E0 extends [unknown, unknown],
  F extends readonly 0[],
> = F["length"] extends 512
  ? Acc
  : [Exclude<Join<Delta, E0>, Acc>] extends [
        infer D2 extends [unknown, unknown],
      ]
    ? [D2] extends [never]
      ? Acc
      : TCS<Acc | D2, D2, E0, [...F, 0]>
    : Acc;

export type TC<E extends [unknown, unknown]> = TCS<E, E, E, []>;

export type Reaches<E extends [unknown, unknown], X> = TC<E> extends infer T
  ? T extends [X, infer Y]
    ? Y
    : never
  : never;

export type InCycle<E extends [unknown, unknown]> = TC<E> extends infer T
  ? T extends [infer X, infer Y]
    ? [Y] extends [X]
      ? X
      : never
    : never
  : never;

// the fact base traced from TypeScript itself: probe assignability between
// every pair in a registry of named types
export type SubEdges<R> = {
  [K in keyof R]: {
    [J in keyof R]: [R[K]] extends [R[J]]
      ? [R[J]] extends [R[K]]
        ? never
        : [K, J]
      : never;
  }[keyof R];
}[keyof R];

// Hasse diagram: keep only edges with no intermediate hop (stratified
// negation via Exclude)
export type DirectEdges<E extends [unknown, unknown]> = Exclude<E, Join<E, E>>;

// service dependency edges: K uses J when some property of K returns or
// holds a J instance
export type UsesEdges<R> = {
  [K in keyof R]: {
    [J in keyof R]: K extends J
      ? never
      : true extends {
            [P in keyof R[K]]: R[K][P] extends (...a: never[]) => infer Ret
              ? [Ret] extends [R[J]]
                ? true
                : never
              : [R[K][P]] extends [R[J]]
                ? true
                : never;
          }[keyof R[K]]
        ? [K, J]
        : never;
  }[keyof R];
}[keyof R];
