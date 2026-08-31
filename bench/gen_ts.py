#!/usr/bin/env python3
"""Convert SWI answer JSONL into TypeScript Equal-assertions against QueryM."""
import json
import pathlib

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "out"
GEN = ROOT / "generated"
GEN.mkdir(exist_ok=True)

HEADER = (
    'import type { Var } from "../../src/term";\n'
    'import type { QueryM } from "../../src/machine";\n'
    'import type { Equal, Expect } from "../../tests/util";\n\n'
)


def cons(elems):
    out = '"nil"'
    for e in reversed(elems):
        out = f'["cons", "{e}", {out}]'
    return out


def peano(n):
    out = '"z"'
    for _ in range(n):
        out = f'["s", {out}]'
    return out


def rows(path):
    return [json.loads(l) for l in (OUT / path).read_text().splitlines() if l]


APPEND_DB = (
    "type DB = [\n"
    '  [["append", "nil", Var<"Y">, Var<"Y">]],\n'
    "  [\n"
    '    ["append", ["cons", Var<"H">, Var<"T">], Var<"Y">, ["cons", Var<"H">, Var<"R">]],\n'
    '    ["append", Var<"T">, Var<"Y">, Var<"R">],\n'
    "  ],\n"
    "];\n"
)

full = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"]
expected = ",\n  ".join(
    f'["append", {cons(r["a"])}, {cons(r["b"])}, {cons(full)}]'
    for r in rows("splits.jsonl")
)
(GEN / "splits.test-d.ts").write_text(
    HEADER
    + APPEND_DB
    + f'type Out = QueryM<["append", Var<"A">, Var<"B">, {cons(full)}], DB>;\n'
    + f"type Want = [\n  {expected},\n];\n"
    + "type _match = Expect<Equal<Out, Want>>;\n"
)

facts = "".join(f'  [["par", "n{i}", "n{i + 1}"]],\n' for i in range(10))
expected = ",\n  ".join(f'["anc", "n0", "{r["x"]}"]' for r in rows("chain.jsonl"))
(GEN / "chain.test-d.ts").write_text(
    HEADER
    + "type DB = [\n"
    + facts
    + '  [["anc", Var<"X">, Var<"Y">], ["par", Var<"X">, Var<"Y">]],\n'
    + '  [["anc", Var<"X">, Var<"Z">], ["par", Var<"X">, Var<"Y">], ["anc", Var<"Y">, Var<"Z">]],\n'
    + "];\n"
    + 'type Out = QueryM<["anc", "n0", Var<"X">], DB>;\n'
    + f"type Want = [\n  {expected},\n];\n"
    + "type _match = Expect<Equal<Out, Want>>;\n"
)

expected = ",\n  ".join(
    f'["add", {peano(r["a"])}, {peano(r["b"])}, {peano(6)}]'
    for r in rows("peano.jsonl")
)
(GEN / "peano.test-d.ts").write_text(
    HEADER
    + "type DB = [\n"
    + '  [["add", "z", Var<"Y">, Var<"Y">]],\n'
    + '  [["add", ["s", Var<"X">], Var<"Y">, ["s", Var<"Z">]], ["add", Var<"X">, Var<"Y">, Var<"Z">]],\n'
    + "];\n"
    + f'type Out = QueryM<["add", Var<"A">, Var<"B">, {peano(6)}], DB>;\n'
    + f"type Want = [\n  {expected},\n];\n"
    + "type _match = Expect<Equal<Out, Want>>;\n"
)

print("generated:", *(p.name for p in sorted(GEN.glob("*.test-d.ts"))))
