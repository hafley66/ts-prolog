// atom = string literal, variable = Var<N> (a guillemet-branded string:
// object-typed vars trip the checker's depth guard ~94 deep, strings run 2000+)
export type Var<N extends string> = `‹${N}›`;

export type Term = string | readonly Term[];

// values typed unknown: infer positions cannot prove Term-ness
export type Subst = { readonly [k: string]: unknown };

// deref until non-var or unbound var; assumes acyclic bindings (no occurs check)
export type Walk<T, S extends Subst> = T extends Var<infer N>
  ? N extends keyof S
    ? Walk<S[N], S>
    : T
  : T;

export type Bind<N extends string, T, S extends Subst> = S & {
  readonly [K in N]: T;
};
