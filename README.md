# ts-prolog

Prolog basics smuggled into the TypeScript type system as literal types, targeting
the TS 7 native (Go) compiler, where the same type-level programs just run faster.

## TOC

- [Status](#status)
- [Thesis](#thesis)
- [The question](#the-question)
- [Demos](#demos)
- [Layout](#layout)
- [Known limits to probe](#known-limits-to-probe)
- [Non-goals](#non-goals)

## Status

MVP works: unification, an ordered clause database, and SLD resolution with
full backtracking run entirely in the type system, checked by both `tsgo`
(7.0.0-dev.20260707.2) and `tsc` 7.0.2 with zero errors.

| proven | test | evidence |
| --- | --- | --- |
| two-way unification, var-var aliasing, nested terms | tests/unify.test-d.ts | 9 assertions |
| facts, rules, recursion, backward queries | tests/family.test-d.ts | `ancestor(A, ann)` enumerates `[bob, tom]` |
| multiple answers in clause order | tests/append.test-d.ts | `append(A, B, [1,2])` yields all 3 splits |
| relational arithmetic | tests/peano.test-d.ts | `add(A, B, 2)` yields all 3 pairs, `mul(2,2,4)` |

`npm run check` (tsgo): 2.7s. `npm run check:tsc`: 1.5s. Same machine, all
six suites including the n=40 deep append.

## Recursion limits and the trampoline

Three engines were built; each hit a different wall.

| engine | shape | forward-append ceiling | wall |
| --- | --- | --- | --- |
| src/solve.ts naive | nested `Solve` in tuple spreads | n = 13 | TS2589, ~100 instantiation depth, non-tail nesting per step |
| machine v1 (global subst) | tail-recursive choicepoint stack | n = 25 | subst values are lazy `infer` captures chained k deep; walking step k forces a k-deep tower |
| src/machine.ts (rewriting) | tail loop + iterative postorder resolver | n = 60, 250+ flat inference steps | ~1000 tail iterations per evaluation, then the ~5M global instantiation-count budget |

Trampoline findings, each verified by an isolated probe:

- Tail-call elimination is real and survives nested conditionals,
  `extends infer` chains, and frame destructuring: a bare loop runs 500+
  iterations where non-tail recursion dies at ~100 depth.
- The substitution must never store unforced projections. Binding
  `infer`-captured tails builds a lazy tower that re-derives all history on
  every walk. The fix: resolution by rewriting. Unify against an empty subst,
  apply it to the remaining goals and answer immediately, discard it.
- Deep structural recursion (`Resolve`, mapped types) burns instantiation
  depth linearly with term depth. The fix: a defunctionalized postorder
  rebuild (`RTerm` in src/machine.ts) with an explicit work stack, every step
  a tail call.
- Fuel-chunked restart (yield a pause marker every 256 iterations, re-enter
  from a wrapper loop) does NOT reset the budget: the ~5M global
  instantiation-count cap grinds on regardless (probe: count-to-5000 chunked
  loop, 7.4s then TS2589). That cap is the floor of the whole approach.
- `Equal` on two 30-deep cons chains trips the comparison stack guard
  (TS2321) even when the answer computed fine. Deep answers get unrolled to
  flat tuples (tail-recursive `UnL`) before comparison.

Verdict so far: `infer` alone is one-way matching, and that is enough. Real
unification comes from threading a substitution type through elementwise
conditional recursion (`src/unify.ts`). Backtracking needs no distribution
trick: trying clauses in tuple order and concatenating the solution tuples of
each branch (`src/solve.ts`) is exactly SLD search, with `[]` as failure.
Standardize-apart falls out of template literal types: clause vars get a
derivation-depth suffix.

## Thesis

Conditional types with `infer` perform one-way structural unification. Distributive
conditional types fan a union across branches, which resembles trying multiple
clauses. Recursion in type aliases gives resolution-style search. The experiment:
push these until they either implement the actual Prolog execution model
(unification, clause selection, backtracking) or hit a wall that names the missing
feature.

TS 7 matters because the Go port of tsc removes the practical ceiling: deep
recursive type instantiation that made TS 5.x checkers crawl becomes cheap enough
to treat the checker as an interpreter.

## The question

Is `infer`-based matching plus union distribution plus recursive aliases enough to
express:

| Prolog piece | TS encoding | status |
| --- | --- | --- |
| terms | string literals, `Var<N>` objects, tuples (src/term.ts) | done |
| unification | subst threaded through recursive conditionals (src/unify.ts) | done, no occurs check |
| variables / bindings | intersection-accumulated subst object, `Walk` deref | done |
| clause database | ordered tuple of `[Head, ...Body]` tuples | done |
| resolution / SLD search | `Solve` recursion over goal list (src/solve.ts) | done |
| backtracking | per-clause solution tuples concatenated in order | done |
| standardize-apart | template literal rename `X -> X.depth` | done |
| occurs check, cyclic terms | none known | open |
| cut, negation-as-failure | `never` propagation tricks | open |
| arithmetic beyond peano | intrinsic string/number types? | open |

## Demos

Six applications, pure TypeScript, no codegen or compiler plugins. The
enforcement device is a phantom rest parameter typed `[never]` when the
query has no solutions, so a violated rule is an ordinary type error at the
call site; every negative case is pinned with `@ts-expect-error`.

| demo | rule set | rejected at compile time |
| --- | --- | --- |
| demos/rbac.test-d.ts | grants + transitive role inheritance | `act("viewer", "delete")` |
| demos/typestate.test-d.ts | state-transition facts + `run` over op lists | `exec(["open", "close", "read"])` |
| demos/sql.test-d.ts | column facts, fk joinability; row types derived by query | `join("users", "users")` |
| demos/di.test-d.ts | dependency lists + recursive `wired` | `resolve("worker")` (missing `queue`) |
| demos/semver.test-d.ts | one shared logic var across goals = constraint solver | `install("v3")` |
| demos/exhaustive.test-d.ts | derived handled-set compared against a union | `Exclude` names the missing `"keydown"` |

## Layout

| path | holds |
| --- | --- |
| src/term.ts | `Var`, `Term`, `Subst`, `Walk`, `Bind` |
| src/unify.ts | `Unify` (subst or `false`) |
| src/solve.ts | naive `Solve`/`Query`, `Freshen`, `Resolve` (kept as the readable reference) |
| src/machine.ts | trampolined `Run`/`QueryM`: tail-recursive SLD loop, iterative resolver |
| tests/*.test-d.ts | `Expect<Equal<...>>` assertions, checked at compile time |

## Known limits to probe

- Instantiation depth ceiling: find the list length / derivation depth where
  each compiler dies, compare tsgo vs tsc.
- Left-recursive clauses (`ancestor(X,Z) :- ancestor(X,Y), ...`) loop forever
  in real Prolog; measure what the checker does (depth error vs hang).
- No occurs check: `X = f(X)` will build a cyclic subst and `Walk` will not
  terminate; decide whether to add the check or document the crash.
- Cut and negation-as-failure need first-solution-only evaluation; `Solve`
  currently always enumerates everything.
- Whether template literal type inference (multiple `infer` holes in one string)
  counts as a second unification engine with different power.

## Non-goals

Rendering Doom in types. The target is the Prolog model and its algorithms, in
readable encodings, with each success or failure documented against the exact
compiler behavior that caused it.
