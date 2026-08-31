# ts-prolog

Prolog basics smuggled into the TypeScript type system as literal types, targeting
the TS 7 native (Go) compiler, where the same type-level programs just run faster.

```ts
import type { Query } from "ts-prolog";

type Src = [
  "parent(tom, bob)",
  "parent(bob, ann)",
  "ancestor(X, Y) :- parent(X, Y)",
  "ancestor(X, Z) :- parent(X, Y), ancestor(Y, Z)",
];
type A = Query<"ancestor(A, ann)", Src>;
//   ^? [["ancestor", "bob", "ann"], ["ancestor", "tom", "ann"]]
```

Everything runs inside `tsc --noEmit`: parsing the clause strings, unification,
SLD resolution with backtracking, cut, negation-as-failure. No codegen, no
plugins, no runtime.

## TOC

- [Status](#status)
- [Thesis](#thesis)
- [The question](#the-question)
- [Demos](#demos)
- [Racing SWI-Prolog](#racing-swi-prolog)
- [Implementation history](#implementation-history)
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
| occurs check | iterative worklist walk before every bind (src/unify.ts) | done |
| cut | `"!"` -> `["$cut", N]` barrier, stack truncation (src/machine.ts) | done, machine only |
| negation-as-failure, once, meta-call | library clauses: `not(G) :- G, !, fail. not(_).` — a var as a goal executes its binding | done via cut |
| asserta / assertz / retract | frame-local clause DB; builtin goals rebuild it for the continuation | done, backtracking undoes changes (SWI asserts would survive) |
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

## Racing SWI-Prolog

`bash bench/race.sh`: SWI-Prolog 10.0.2 solves each problem and writes its
answers as JSONL; bench/gen_ts.py converts that JSONL into `Equal`
assertions; tsgo must solve the same query and prove answer-for-answer,
order-for-order agreement. A wrong or reordered answer fails the build.
Results land in bench/results.jsonl.

| problem | answers | swipl wall | tsgo wall | agree |
| --- | --- | --- | --- | --- |
| append splits of an 8-list | 9 | 38ms | 486ms | yes |
| ancestor over a 10-chain | 10 | 29ms | 436ms | yes |
| peano pairs summing to 6 | 7 | 28ms | 340ms | yes |
| towers of hanoi, 3 disks | 1 (7 moves) | 31ms | 378ms | yes |
| permutations of a 4-list | 24 | 31ms | 1351ms | yes |
| 3-coloring Australia (6 regions) | 6 | 31ms | 548ms | yes |
| naive reverse of a 6-list | 1 | 31ms | 364ms | yes |
| mini-zebra, 3 houses (who owns the fish) | 1 | 32ms | 484ms | yes |

Startup baselines: swipl 67ms, npx+tsgo 1781ms cold / ~400ms warm. Wall
clock is all process startup on both sides; net solve time is
single-digit-to-tens of ms for both engines at these sizes. The difference
is capacity: SWI runs these at n in the millions, the type checker runs out
of fuel at n around 60 for deep terms and ~250 inference steps for flat
ones.

A third lane reads answers OUT of the type system with no candidate in
hand: typescript@7 dropped the JS compiler API (its lib/ is a shim around
the Go binary), so tools/print-type.mjs runs the 5.9 checker API
(`getTypeAtLocation` + `typeToString` with `NoTruncation`) over a
query-only file and prints the fully evaluated alias. The printed tuple
text is valid JSON; bench/compare.py normalizes it (uncons, unpeano) and
diffs against SWI's JSONL. All three problems: exact match, ~400-560ms per
extraction.

## Implementation history

Three engines, each killed by a different limit of the checker's execution
model. The commit log is the experiment record.

| commit | engine | died at | lesson |
| --- | --- | --- | --- |
| c2a62da | naive `Solve`: recursive conditionals, solution tuples concatenated by spread | forward append n = 13, TS2589 | spreads over recursive results are non-tail; ~100 instantiation depth is the wall |
| f0e576a (v1, replaced in-place) | tail-recursive loop over a choicepoint stack, one global substitution | n = 25 | bindings stored as `infer` captures stay unforced; walking at step k forces a k-deep lazy tower |
| f0e576a (v2, shipped) | resolution by rewriting: per-step subst applied to goals + answer then discarded; `RTerm` iterative postorder resolver | n = 60 deep, ~250 flat steps | remaining caps: ~1000 tail iterations per evaluation, ~5M instantiation count per check run |

Dead end proven along the way: fuel-chunked re-entry (pause marker every 256
iterations, outer loop resumes) does not reset the ~5M global budget, so
there is no fourth engine inside the checker. Escaping that budget means
leaving the checker (see tyvm), which forfeits the whole point of running in
`tsc --noEmit`.

## Surface syntax

The lexer verdict above still buys real Prolog source, parsed at the type
level (src/parse.ts): a recursive-descent parser over template literal
holes turns clause strings into the tuple encoding.

```ts
type Src = [
  "parent(tom, bob)",
  "ancestor(X, Y) :- parent(X, Y)",
  "ancestor(X, Z) :- parent(X, Y), ancestor(Y, Z)",
];
type A = Query<"ancestor(A, bob)", Src>; // [["ancestor", "tom", "bob"]]
```

Vars are initial-uppercase or underscore, cut is `!`, and the whole family
and NAF suites pass written this way (tests/parse.test-d.ts).

## Layout

| path | holds |
| --- | --- |
| src/term.ts | `Var`, `Term`, `Subst`, `Walk`, `Bind` |
| src/unify.ts | `Unify` (subst or `false`), occurs check |
| src/parse.ts | type-level Prolog source parser: `Clause`, `Program`, `Query` |
| src/solve.ts | naive `Solve`/`Query`, `Freshen`, `Resolve` (kept as the readable reference) |
| src/machine.ts | trampolined `Run`/`QueryM`: tail-recursive SLD loop, iterative resolver |
| tests/*.test-d.ts | `Expect<Equal<...>>` assertions, checked at compile time |

## Measured limits

- Forward append ceiling n = 60 (unchanged after adding the occurs check),
  ~250 flat inference steps, ~5M instantiation count per check run.
- Two variable-free cons chains unify up to depth 80, die by 120:
  `UnifyArgs` descends non-tail per element pair.
- Left recursion (`anc(X,Z) :- anc(X,Y), ...` listed first) burns fuel and
  dies as TS2589 after ~6s. The checker cannot hang forever; nontermination
  degrades to an error, unlike real Prolog.
- Cut in the query itself is not transformed (only clause bodies);
  `["$cut", N]`, `asserta`, `assertz`, and `retract` are reserved functors.
- `retract` is deterministic (first match, no retry on backtracking) and
  matches clause heads; SWI's retract re-satisfies on backtracking.
- Template literal inference answered: each hole matches leftmost-shortest
  with literal anchoring, no cross-hole constraint solving, no backtracking.
  A lexer, and not a second unification engine. Probes: `"abbc"` vs
  `` `${X}b${Y}` `` gives `X="a"` with no backtracking to reconcile a later
  literal.

## Non-goals

Rendering Doom in types. The target is the Prolog model and its algorithms, in
readable encodings, with each success or failure documented against the exact
compiler behavior that caused it.
