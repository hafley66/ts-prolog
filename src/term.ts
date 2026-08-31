// atom = string literal, variable = Var<N>, compound = [functor, ...args]
export type Var<N extends string> = { readonly var: N };

export type Term = string | Var<string> | readonly Term[];

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
