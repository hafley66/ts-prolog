# ts-prolog

Prolog basics smuggled into the TypeScript type system as literal types, targeting
the TS 7 native (Go) compiler, where the same type-level programs just run faster.

## TOC

- [Thesis](#thesis)
- [The question](#the-question)
- [Prolog model vs TS type system](#prolog-model-vs-ts-type-system)
- [Known limits to probe](#known-limits-to-probe)
- [Non-goals](#non-goals)

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

| Prolog piece | candidate TS encoding | open? |
| --- | --- | --- |
| terms | literal types, tuples, template literal types | encodable |
| unification | conditional `extends` with `infer`, both-direction checks | partially, one-way by default |
| variables / bindings | `infer` captures threaded through an env object type | open |
| clause database | union of tuple-encoded clauses | encodable |
| resolution / SLD search | recursive conditional types over the clause union | open |
| backtracking | distributive conditionals as branch-and-fail (`never` = fail) | open |
| occurs check, cyclic terms | none known | open |
| cut, negation-as-failure | `never` propagation tricks | open |

## Known limits to probe

- Instantiation depth limits (raised or unchanged in tsgo?).
- `infer` is match-time only; no persistent mutable binding store, so the
  environment must be threaded as an accumulator type.
- Distribution gives all-branches evaluation, and Prolog wants ordered clause
  trial with cut; ordering may need tuple-encoded clause lists instead of unions.
- Tail-recursive alias elimination: which shapes tsc optimizes vs stack-overflows.
- Whether template literal type inference (multiple `infer` holes in one string)
  counts as a second unification engine with different power.

## Non-goals

Rendering Doom in types. The target is the Prolog model and its algorithms, in
readable encodings, with each success or failure documented against the exact
compiler behavior that caused it.
