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


def cons_raw(term_texts):
    out = '"nil"'
    for t in reversed(term_texts):
        out = f'["cons", {t}, {out}]'
    return out


def cons(elems):
    return cons_raw([f'"{e}"' for e in elems])


def peano(n):
    out = '"z"'
    for _ in range(n):
        out = f'["s", {out}]'
    return out


def rows(name):
    path = OUT / f"{name}.jsonl"
    return [json.loads(l) for l in path.read_text().splitlines() if l]


def clauses(*cs):
    return "type DB = [\n" + "".join(f"  {c},\n" for c in cs) + "];\n"


APPEND_DB = clauses(
    '[["append", "nil", Var<"Y">, Var<"Y">]]',
    '[\n    ["append", ["cons", Var<"H">, Var<"T">], Var<"Y">, ["cons", Var<"H">, Var<"R">]],\n'
    '    ["append", Var<"T">, Var<"Y">, Var<"R">],\n  ]',
)

APP = (
    '[["app", "nil", Var<"Y">, Var<"Y">]]',
    '[["app", ["cons", Var<"H">, Var<"T">], Var<"Y">, ["cons", Var<"H">, Var<"R">]], ["app", Var<"T">, Var<"Y">, Var<"R">]]',
)

SPLITS_FULL = ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"]
NREV_SRC = ["e1", "e2", "e3", "e4", "e5", "e6"]
COLOR_BODY = (
    '["diff", Var<"WA">, Var<"NT">], ["diff", Var<"WA">, Var<"SA">], '
    '["diff", Var<"NT">, Var<"SA">], ["diff", Var<"NT">, Var<"Q">], '
    '["diff", Var<"SA">, Var<"Q">], ["diff", Var<"SA">, Var<"NSW">], '
    '["diff", Var<"Q">, Var<"NSW">], ["diff", Var<"NSW">, Var<"V">], '
    '["diff", Var<"SA">, Var<"V">]'
)

# problem -> (db_ts, goal_ts, want_row builder over one JSONL row)
PROBLEMS = {
    "splits": (
        APPEND_DB,
        f'["append", Var<"A">, Var<"B">, {cons(SPLITS_FULL)}]',
        lambda r: f'["append", {cons(r["a"])}, {cons(r["b"])}, {cons(SPLITS_FULL)}]',
    ),
    "chain": (
        clauses(
            *(f'[["par", "n{i}", "n{i + 1}"]]' for i in range(10)),
            '[["anc", Var<"X">, Var<"Y">], ["par", Var<"X">, Var<"Y">]]',
            '[["anc", Var<"X">, Var<"Z">], ["par", Var<"X">, Var<"Y">], ["anc", Var<"Y">, Var<"Z">]]',
        ),
        '["anc", "n0", Var<"X">]',
        lambda r: f'["anc", "n0", "{r["x"]}"]',
    ),
    "peano": (
        clauses(
            '[["add", "z", Var<"Y">, Var<"Y">]]',
            '[["add", ["s", Var<"X">], Var<"Y">, ["s", Var<"Z">]], ["add", Var<"X">, Var<"Y">, Var<"Z">]]',
        ),
        f'["add", Var<"A">, Var<"B">, {peano(6)}]',
        lambda r: f'["add", {peano(r["a"])}, {peano(r["b"])}, {peano(6)}]',
    ),
    "hanoi": (
        clauses(
            *APP,
            '[["hanoi", "z", Var<"F0">, Var<"T0">, Var<"V0">, "nil"]]',
            '[\n    ["hanoi", ["s", Var<"N">], Var<"F">, Var<"T">, Var<"V">, Var<"Ms">],\n'
            '    ["hanoi", Var<"N">, Var<"F">, Var<"V">, Var<"T">, Var<"M1">],\n'
            '    ["hanoi", Var<"N">, Var<"V">, Var<"T">, Var<"F">, Var<"M2">],\n'
            '    ["app", Var<"M1">, ["cons", ["m", Var<"F">, Var<"T">], Var<"M2">], Var<"Ms">],\n  ]',
        ),
        f'["hanoi", {peano(3)}, "a", "c", "b", Var<"Ms">]',
        lambda r: f'["hanoi", {peano(3)}, "a", "c", "b", '
        f'{cons_raw([f'["m", "{f}", "{t}"]' for f, t in r["moves"]])}]',
    ),
    "perm": (
        clauses(
            '[["sel", Var<"X">, ["cons", Var<"X">, Var<"T">], Var<"T">]]',
            '[["sel", Var<"X">, ["cons", Var<"H">, Var<"T">], ["cons", Var<"H">, Var<"R">]], ["sel", Var<"X">, Var<"T">, Var<"R">]]',
            '[["perm", "nil", "nil"]]',
            '[["perm", Var<"L">, ["cons", Var<"X">, Var<"P">]], ["sel", Var<"X">, Var<"L">, Var<"R">], ["perm", Var<"R">, Var<"P">]]',
        ),
        f'["perm", {cons(["a", "b", "c", "d"])}, Var<"P">]',
        lambda r: f'["perm", {cons(["a", "b", "c", "d"])}, {cons(r["p"])}]',
    ),
    "color": (
        clauses(
            '[["diff", "r", "g"]]',
            '[["diff", "r", "b"]]',
            '[["diff", "g", "r"]]',
            '[["diff", "g", "b"]]',
            '[["diff", "b", "r"]]',
            '[["diff", "b", "g"]]',
            f'[\n    ["col", Var<"WA">, Var<"NT">, Var<"SA">, Var<"Q">, Var<"NSW">, Var<"V">],\n'
            f"    {COLOR_BODY},\n  ]",
        ),
        '["col", Var<"WA">, Var<"NT">, Var<"SA">, Var<"Q">, Var<"NSW">, Var<"V">]',
        lambda r: '["col", ' + ", ".join(f'"{c}"' for c in r["c"]) + "]",
    ),
    "nrev": (
        clauses(
            *APP,
            '[["nrev", "nil", "nil"]]',
            '[\n    ["nrev", ["cons", Var<"H">, Var<"T">], Var<"R">],\n'
            '    ["nrev", Var<"T">, Var<"RT">],\n'
            '    ["app", Var<"RT">, ["cons", Var<"H">, "nil"], Var<"R">],\n  ]',
        ),
        f'["nrev", {cons(NREV_SRC)}, Var<"R">]',
        lambda r: f'["nrev", {cons(NREV_SRC)}, {cons(r["r"])}]',
    ),
}

for name, (db, goal, want_row) in PROBLEMS.items():
    (GEN / f"{name}.query.ts").write_text(
        HEADER + db + f"export type Out = QueryM<{goal}, DB>;\n"
    )
    want = ",\n  ".join(want_row(r) for r in rows(name))
    (GEN / f"{name}.test-d.ts").write_text(
        HEADER
        + db
        + f"type Out = QueryM<{goal}, DB>;\n"
        + f"type Want = [\n  {want},\n];\n"
        + "type _match = Expect<Equal<Out, Want>>;\n"
    )

print("generated:", *(p.name for p in sorted(GEN.glob("*.ts"))))
