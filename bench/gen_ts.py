#!/usr/bin/env python3
"""Convert SWI answer JSONL into TypeScript Equal-assertions against QueryM."""
import json
import pathlib

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "out"
GEN = ROOT / "generated"
GEN.mkdir(exist_ok=True)

HEADER = (
    'import type { Var } from "../../src/01-term";\n'
    'import type { QueryM } from "../../src/04-machine";\n'
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
    "puzzle": (
        clauses(
            '[["eq", Var<"X">, Var<"X">]]',
            '[["mem", Var<"X">, ["cons", Var<"X">, Var<"T">]]]',
            '[["mem", Var<"X">, ["cons", Var<"H">, Var<"T">]], ["mem", Var<"X">, Var<"T">]]',
            '[["right", Var<"X">, Var<"Y">, ["cons", Var<"X">, ["cons", Var<"Y">, Var<"R">]]]]',
            '[["right", Var<"X">, Var<"Y">, ["cons", Var<"H">, Var<"T">]], ["right", Var<"X">, Var<"Y">, Var<"T">]]',
            '[\n    ["puzzle", Var<"Who">],\n'
            '    ["eq", Var<"Hs">, '
            + cons_raw(
                [
                    '["h", "norwegian", Var<"A1">, Var<"A2">]',
                    '["h", Var<"B1">, Var<"B2">, Var<"B3">]',
                    '["h", Var<"C1">, Var<"C2">, Var<"C3">]',
                ]
            )
            + "],\n"
            '    ["mem", ["h", "brit", "red", Var<"D1">], Var<"Hs">],\n'
            '    ["mem", ["h", "spaniard", Var<"E1">, "dog"], Var<"Hs">],\n'
            '    ["right", ["h", Var<"F1">, "red", Var<"F2">], ["h", Var<"G1">, "green", Var<"G2">], Var<"Hs">],\n'
            '    ["mem", ["h", Var<"I1">, "blue", "cat"], Var<"Hs">],\n'
            '    ["mem", ["h", Var<"Who">, Var<"J1">, "fish"], Var<"Hs">],\n  ]',
        ),
        '["puzzle", Var<"Who">]',
        lambda r: f'["puzzle", "{r["who"]}"]',
    ),
    "collect": (
        clauses(
            '[["par", "tom", "bob"]]',
            '[["par", "tom", "liz"]]',
            '[["par", "tom", "ann"]]',
            '[["par", "bob", "pat"]]',
            '[["plen", "nil", "z"]]',
            '[["plen", ["cons", Var<"H">, Var<"T">], ["s", Var<"N">]], ["plen", Var<"T">, Var<"N">]]',
            '[["who", "tom"]]',
            '[["who", "bob"]]',
            '[["who", "liz"]]',
            '[\n    ["kids", Var<"P">, Var<"L">, Var<"N">],\n'
            '    ["findall", Var<"X">, ["par", Var<"P">, Var<"X">], Var<"L">],\n'
            '    ["plen", Var<"L">, Var<"N">],\n  ]',
            '[["row", Var<"P">, Var<"L">, Var<"N">], ["who", Var<"P">], ["kids", Var<"P">, Var<"L">, Var<"N">]]',
        ),
        '["row", Var<"P">, Var<"L">, Var<"N">]',
        lambda r: f'["row", "{r["p"]}", {cons(r["kids"])}, {peano(r["n"])}]',
    ),
    "queens": (
        clauses(
            '[["sel", Var<"X">, ["cons", Var<"X">, Var<"T">], Var<"T">]]',
            '[["sel", Var<"X">, ["cons", Var<"H">, Var<"T">], ["cons", Var<"H">, Var<"R">]], ["sel", Var<"X">, Var<"T">, Var<"R">]]',
            '[["ok", Var<"Q0">, "nil", Var<"D0">]]',
            '[\n    ["ok", Var<"Q">, ["cons", Var<"P">, Var<"Ps">], Var<"D">],\n'
            '    ["plus", Var<"P">, Var<"D">, Var<"S1">],\n'
            '    ["neq", Var<"S1">, Var<"Q">],\n'
            '    ["plus", Var<"Q">, Var<"D">, Var<"S2">],\n'
            '    ["neq", Var<"S2">, Var<"P">],\n'
            '    ["plus", Var<"D">, 1, Var<"D2">],\n'
            '    ["ok", Var<"Q">, Var<"Ps">, Var<"D2">],\n  ]',
            '[["place", "nil", Var<"Acc">, Var<"Acc">]]',
            '[\n    ["place", Var<"L">, Var<"Acc">, Var<"Qs">],\n'
            '    ["sel", Var<"Q">, Var<"L">, Var<"R">],\n'
            '    ["ok", Var<"Q">, Var<"Acc">, 1],\n'
            '    ["place", Var<"R">, ["cons", Var<"Q">, Var<"Acc">], Var<"Qs">],\n  ]',
            '[["queens", Var<"Qs">], ["place", '
            + cons_raw(["1", "2", "3", "4", "5"])
            + ', "nil", Var<"Qs">]]',
        ),
        '["queens", Var<"Qs">]',
        lambda r: f'["queens", {cons_raw([str(int(x)) for x in r["q"]])}]',
    ),
    "pyth": (
        clauses(
            '[\n    ["pyth", Var<"X">, Var<"Y">, Var<"Z">],\n'
            '    ["between", 1, 13, Var<"X">],\n'
            '    ["between", Var<"X">, 13, Var<"Y">],\n'
            '    ["times", Var<"X">, Var<"X">, Var<"XX">],\n'
            '    ["times", Var<"Y">, Var<"Y">, Var<"YY">],\n'
            '    ["plus", Var<"XX">, Var<"YY">, Var<"ZZ">],\n'
            '    ["between", Var<"Y">, 20, Var<"Z">],\n'
            '    ["times", Var<"Z">, Var<"Z">, Var<"ZZ">],\n  ]',
        ),
        '["pyth", Var<"X">, Var<"Y">, Var<"Z">]',
        lambda r: f'["pyth", {r["x"]}, {r["y"]}, {r["z"]}]',
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
