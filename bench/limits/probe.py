#!/usr/bin/env python3
"""Breaking-point probes: generate a parameterized type-level program, check it
with tsgo, record ms / peak-RSS / error class. Bisect mode finds the ceiling.

usage:
  probe.py <name> <n> [<n> ...]         run sizes
  probe.py <name> --bisect <lo> <hi>    lo must pass, hi must fail; prints ceiling
"""
import os
import pathlib
import re
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
GEN = pathlib.Path(__file__).parent / "generated"
GEN.mkdir(exist_ok=True)
RESULTS = pathlib.Path(__file__).parent / "results.jsonl"
TIMEOUT = int(os.environ.get("PROBE_TIMEOUT", "240"))

ENGINE = os.environ.get("ENGINE", "v4")
if ENGINE == "v5":
    MACHINE = 'import type { QueryM5 as QueryM } from "../../../src/07-machine-v5";\n'
elif ENGINE.startswith("k"):
    MACHINE = (
        'import type { QueryMK } from "../../../src/08-machine-k";\n'
        "type QueryM<G, DB extends readonly unknown[]> = "
        f"QueryMK<G, DB, {int(ENGINE[1:])}>;\n"
    )
else:
    MACHINE = 'import type { QueryM } from "../../../src/04-machine";\n'
HEADER = (
    'import type { Var } from "../../../src/01-term";\n'
    'import type { Unify } from "../../../src/02-unify";\n'
    + MACHINE
    + 'import type { Term } from "../../../src/05-parse";\n'
    'import type { Equal, Expect } from "../../../tests/util";\n\n'
)


def cons(elems):
    out = '"nil"'
    for e in reversed(elems):
        out = f'["cons", "{e}", {out}]'
    return out


def cons_raw(texts):
    out = '"nil"'
    for t in reversed(texts):
        out = f'["cons", {t}, {out}]'
    return out


# each probe: n -> ts source whose successful check proves the run finished
def p_chain(n):
    facts = "".join(f'  [["par", "n{i}", "n{i + 1}"]],\n' for i in range(n))
    db = (
        "type DB = [\n" + facts +
        '  [["anc", Var<"X">, Var<"Y">], ["par", Var<"X">, Var<"Y">]],\n'
        '  [["anc", Var<"X">, Var<"Z">], ["par", Var<"X">, Var<"Y">], ["anc", Var<"Y">, Var<"Z">]],\n'
        "];\n"
    )
    return (
        db + 'type Out = QueryM<["anc", "n0", Var<"X">], DB>;\n'
        f'type _c = Expect<Equal<Out["length"], {n}>>;\n'
    )


def p_nrev(n):
    elems = [f"e{i}" for i in range(1, n + 1)]
    db = (
        "type DB = [\n"
        '  [["app", "nil", Var<"Y">, Var<"Y">]],\n'
        '  [["app", ["cons", Var<"H">, Var<"T">], Var<"Y">, ["cons", Var<"H">, Var<"R">]], ["app", Var<"T">, Var<"Y">, Var<"R">]],\n'
        '  [["nrev", "nil", "nil"]],\n'
        '  [["nrev", ["cons", Var<"H">, Var<"T">], Var<"R">], ["nrev", Var<"T">, Var<"RT">], ["app", Var<"RT">, ["cons", Var<"H">, "nil"], Var<"R">]],\n'
        "];\n"
    )
    return (
        db + f'type Out = QueryM<["nrev", {cons(elems)}, Var<"R">], DB>;\n'
        f'type Want = [["nrev", {cons(elems)}, {cons(list(reversed(elems)))}]];\n'
        "type _c = Expect<Equal<Out, Want>>;\n"
    )


def p_flat(n):
    body = ", ".join('["t"]' for _ in range(n))
    db = f'type DB = [\n  [["t"]],\n  [["main"], {body}],\n];\n'
    return (
        db + 'type Out = QueryM<["main"], DB>;\n'
        'type _c = Expect<Equal<Out["length"], 1>>;\n'
    )


def p_sum(n):
    return (
        f'type Out = QueryM<["plus", {n}, {n}, Var<"Z">], []>;\n'
        f'type _c = Expect<Equal<Out, [["plus", {n}, {n}, {2 * n}]]>>;\n'
    )


def p_diff(n):
    return (
        f'type Out = QueryM<["plus", Var<"X">, {n}, {2 * n}], []>;\n'
        f'type _c = Expect<Equal<Out, [["plus", {n}, {n}, {2 * n}]]>>;\n'
    )


def p_deep(n):
    a = '"a"'
    b = '"‹X›"'
    for _ in range(n):
        a = f'["f", {a}]'
        b = f'["f", {b}]'
    return (
        f"type A = {a};\ntype B = {b};\n"
        'type S = Unify<A, B, {}>;\n'
        'type _c = Expect<Equal<S extends false ? "clash" : "ok", "ok">>;\n'
    )


QCOUNT = {4: 2, 5: 10, 6: 4, 7: 40, 8: 92}


def p_queens(n):
    db = (
        "type DB = [\n"
        '  [["sel", Var<"X">, ["cons", Var<"X">, Var<"T">], Var<"T">]],\n'
        '  [["sel", Var<"X">, ["cons", Var<"H">, Var<"T">], ["cons", Var<"H">, Var<"R">]], ["sel", Var<"X">, Var<"T">, Var<"R">]],\n'
        '  [["ok", Var<"Q0">, "nil", Var<"D0">]],\n'
        '  [["ok", Var<"Q">, ["cons", Var<"P">, Var<"Ps">], Var<"D">], ["plus", Var<"P">, Var<"D">, Var<"S1">], ["neq", Var<"S1">, Var<"Q">], ["plus", Var<"Q">, Var<"D">, Var<"S2">], ["neq", Var<"S2">, Var<"P">], ["plus", Var<"D">, 1, Var<"D2">], ["ok", Var<"Q">, Var<"Ps">, Var<"D2">]],\n'
        '  [["place", "nil", Var<"Acc">, Var<"Acc">]],\n'
        '  [["place", Var<"L">, Var<"Acc">, Var<"Qs">], ["sel", Var<"Q">, Var<"L">, Var<"R">], ["ok", Var<"Q">, Var<"Acc">, 1], ["place", Var<"R">, ["cons", Var<"Q">, Var<"Acc">], Var<"Qs">]],\n'
        f'  [["queens", Var<"Qs">], ["place", {cons_raw([str(i) for i in range(1, n + 1)])}, "nil", Var<"Qs">]],\n'
        "];\n"
    )
    return (
        db + 'type Out = QueryM<["queens", Var<"Qs">], DB>;\n'
        f'type _c = Expect<Equal<Out["length"], {QCOUNT[n]}>>;\n'
    )


def p_mult(n):
    return (
        f'type Out = QueryM<["times", {n}, {n}, Var<"Z">], []>;\n'
        f'type _c = Expect<Equal<Out, [["times", {n}, {n}, {n * n}]]>>;\n'
    )


def p_div(n):
    return (
        f'type Out = QueryM<["times", {n}, Var<"Y">, {n * n}], []>;\n'
        f'type _c = Expect<Equal<Out, [["times", {n}, {n}, {n * n}]]>>;\n'
    )


def p_between(n):
    return (
        f'type Out = QueryM<["between", 1, {n}, Var<"X">], []>;\n'
        f'type _c = Expect<Equal<Out["length"], {n}>>;\n'
    )


def p_parsedeep(n):
    src = "f(" * n + "a" + ")" * n
    want = '"a"'
    for _ in range(n):
        want = f'["f", {want}]'
    return (
        f"type Out = Term<{src!r}>;\n"
        f"type _c = Expect<Equal<Out, {want}>>;\n"
    )


def p_parselong(n):
    src = "f(" + ", ".join("a" for _ in range(n)) + ")"
    want = "[" + ", ".join(['"f"'] + ['"a"'] * n) + "]"
    return (
        f"type Out = Term<{src!r}>;\n"
        f"type _c = Expect<Equal<Out, {want}>>;\n"
    )


# zebra2 = same 14 clues most-constrained-first (SWI oracle: 13517 -> 1395
# inferences); indices into p_zebra's clue list
ZORDER = [10, 3, 4, 0, 6, 7, 2, 8, 1, 9, 5, 11, 12, 13]


def p_zebra2(n):
    return p_zebra(n, ZORDER)


# n = how many of the 14 zebra clues are included (answer count is not
# monotone in n, so run sizes directly instead of bisecting)
def p_zebra(n, order=None):
    ctr = [0]

    def w():
        ctr[0] += 1
        return f'Var<"W{ctr[0]}">'

    def h(*args):
        return "[" + ", ".join(
            ['"h"'] + [a if a.startswith("Var") else f'"{a}"' for a in args]
        ) + "]"

    def V(a):
        return f"Var<{a!r}>"

    def mem(x):
        return f'["mem", {x}, Var<"Hs">]'

    def right(x, y):
        return f'["right", {x}, {y}, Var<"Hs">]'

    def nxt(x, y):
        return f'["next", {x}, {y}, Var<"Hs">]'

    clues = [
        mem(h("brit", "red", w(), w(), w())),
        mem(h("swede", w(), w(), w(), "dog")),
        mem(h("dane", w(), "tea", w(), w())),
        right(h(w(), "green", w(), w(), w()), h(w(), "white", w(), w(), w())),
        mem(h(w(), "green", "coffee", w(), w())),
        mem(h(w(), w(), w(), "pallmall", "bird")),
        mem(h(w(), "yellow", w(), "dunhill", w())),
        nxt(h(w(), w(), w(), w(), "horse"), h(w(), "yellow", w(), "dunhill", w())),
        mem(h(w(), w(), "beer", "bluemaster", w())),
        mem(h("german", w(), w(), "prince", w())),
        nxt(h("norwegian", w(), w(), w(), w()), h(w(), "blue", w(), w(), w())),
        nxt(h(w(), w(), w(), "blend", w()), h(w(), w(), w(), w(), "cat")),
        nxt(h(w(), w(), w(), "blend", w()), h(w(), w(), "water", w(), w())),
        mem(h('Var<"Who">', w(), w(), w(), "fish")),
    ]
    skeleton = cons_raw([
        h("norwegian", w(), w(), w(), w()),
        w(),
        h(w(), w(), "milk", w(), w()),
        w(),
        w(),
    ])
    if order is not None:
        clues = [clues[i] for i in order]
    body = ",\n    ".join([f'["eq", Var<"Hs">, {skeleton}]'] + clues[:n])
    db = (
        "type DB = [\n"
        '  [["eq", Var<"E">, Var<"E">]],\n'
        '  [["right", Var<"X">, Var<"Y">, ["cons", Var<"X">, ["cons", Var<"Y">, Var<"R0">]]]],\n'
        '  [["right", Var<"X">, Var<"Y">, ["cons", Var<"H0">, Var<"T0">]], ["right", Var<"X">, Var<"Y">, Var<"T0">]],\n'
        '  [["next", Var<"X">, Var<"Y">, Var<"L">], ["right", Var<"X">, Var<"Y">, Var<"L">]],\n'
        '  [["next", Var<"X">, Var<"Y">, Var<"L">], ["right", Var<"Y">, Var<"X">, Var<"L">]],\n'
        '  [["mem", Var<"X">, ["cons", Var<"X">, Var<"T1">]]],\n'
        '  [["mem", Var<"X">, ["cons", Var<"H1">, Var<"T1">]], ["mem", Var<"X">, Var<"T1">]],\n'
        f'  [["zebra", Var<"Who">],\n    {body}],\n'
        "];\n"
    )
    return (
        db + 'type Out = QueryM<["zebra", Var<"Who">], DB>;\n'
        'type _c = Expect<Equal<Out["length"] extends number ? true : false, true>>;\n'
    )


# zebra3: five parallel attribute lists joined by index (ix) / offset (r2);
# each goal carries two 5-lists instead of the 35-node h/5 skeleton
def p_zebra3(n):
    ctr = [0]

    def w():
        ctr[0] += 1
        return f'Var<"W{ctr[0]}">'

    def lst(*xs):
        out = '"nil"'
        for x in reversed(xs):
            out = f'["cons", {x if x.startswith("Var") else chr(34) + x + chr(34)}, {out}]'
        return out

    def ix(x, xs, y, ys):
        return f'["ix", "{x}", Var<"{xs}">, {y if y.startswith("Var") else chr(34) + y + chr(34)}, Var<"{ys}">]'

    def n2(x, xs, y, ys):
        return f'["n2", "{x}", Var<"{xs}">, "{y}", Var<"{ys}">]'

    clues = [
        n2("norwegian", "Men", "blue", "Cols"),
        f'["r2", "green", Var<"Cols">, "white", Var<"Cols">]',
        ix("green", "Cols", "coffee", "Drinks"),
        ix("brit", "Men", "red", "Cols"),
        ix("yellow", "Cols", "dunhill", "Smokes"),
        n2("horse", "Pets", "dunhill", "Smokes"),
        ix("dane", "Men", "tea", "Drinks"),
        ix("beer", "Drinks", "bluemaster", "Smokes"),
        ix("swede", "Men", "dog", "Pets"),
        ix("german", "Men", "prince", "Smokes"),
        ix("pallmall", "Smokes", "bird", "Pets"),
        n2("blend", "Smokes", "cat", "Pets"),
        n2("blend", "Smokes", "water", "Drinks"),
        f'["ix", Var<"Who">, Var<"Men">, "fish", Var<"Pets">]',
    ]
    seed = (
        f'["ls", {lst("norwegian", w(), w(), w(), w())}, {lst(w(), w(), w(), w(), w())}, '
        f'{lst(w(), w(), "milk", w(), w())}, {lst(w(), w(), w(), w(), w())}, '
        f'{lst(w(), w(), w(), w(), w())}]'
    )
    body = ",\n    ".join(
        [f'["eq", ["ls", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">], {seed}]']
        + clues[:n]
    )
    db = (
        "type DB = [\n"
        '  [["eq", Var<"E">, Var<"E">]],\n'
        '  [["ix", Var<"X">, ["cons", Var<"X">, Var<"T0">], Var<"Y">, ["cons", Var<"Y">, Var<"U0">]]],\n'
        '  [["ix", Var<"X">, ["cons", Var<"H0">, Var<"T0">], Var<"Y">, ["cons", Var<"H1">, Var<"U0">]], ["ix", Var<"X">, Var<"T0">, Var<"Y">, Var<"U0">]],\n'
        '  [["r2", Var<"X">, ["cons", Var<"X">, Var<"T0">], Var<"Y">, ["cons", Var<"H0">, ["cons", Var<"Y">, Var<"U0">]]]],\n'
        '  [["r2", Var<"X">, ["cons", Var<"H0">, Var<"T0">], Var<"Y">, ["cons", Var<"H1">, Var<"U0">]], ["r2", Var<"X">, Var<"T0">, Var<"Y">, Var<"U0">]],\n'
        '  [["n2", Var<"X">, Var<"Xs">, Var<"Y">, Var<"Ys">], ["r2", Var<"X">, Var<"Xs">, Var<"Y">, Var<"Ys">]],\n'
        '  [["n2", Var<"X">, Var<"Xs">, Var<"Y">, Var<"Ys">], ["r2", Var<"Y">, Var<"Ys">, Var<"X">, Var<"Xs">]],\n'
        f'  [["zebra", Var<"Who">],\n    {body}],\n'
        "];\n"
    )
    return (
        db + 'type Out = QueryM<["zebra", Var<"Who">], DB>;\n'
        'type _c = Expect<Equal<Out["length"] extends number ? true : false, true>>;\n'
    )


# zebra4: zebra3's clues chained through staged predicates z0..z13 so the
# pending goal list never exceeds [clue, next-stage call]
def p_zebra4(n):
    ctr = [0]

    def w():
        ctr[0] += 1
        return f'Var<"W{ctr[0]}">'

    def lst(*xs):
        out = '"nil"'
        for x in reversed(xs):
            out = f'["cons", {x if x.startswith("Var") else chr(34) + x + chr(34)}, {out}]'
        return out

    def ix(x, xs, y, ys):
        return f'["ix", "{x}", Var<"{xs}">, "{y}", Var<"{ys}">]'

    def n2(x, xs, y, ys):
        return f'["n2", "{x}", Var<"{xs}">, "{y}", Var<"{ys}">]'

    clues = [
        n2("norwegian", "Men", "blue", "Cols"),
        '["r2", "green", Var<"Cols">, "white", Var<"Cols">]',
        ix("green", "Cols", "coffee", "Drinks"),
        ix("brit", "Men", "red", "Cols"),
        ix("yellow", "Cols", "dunhill", "Smokes"),
        n2("horse", "Pets", "dunhill", "Smokes"),
        ix("dane", "Men", "tea", "Drinks"),
        ix("beer", "Drinks", "bluemaster", "Smokes"),
        ix("swede", "Men", "dog", "Pets"),
        ix("german", "Men", "prince", "Smokes"),
        ix("pallmall", "Smokes", "bird", "Pets"),
        n2("blend", "Smokes", "cat", "Pets"),
        n2("blend", "Smokes", "water", "Drinks"),
        '["ix", Var<"Who">, Var<"Men">, "fish", Var<"Pets">]',
    ][:n]
    args = 'Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">'
    stages = [
        f'  [["z{k}", {args}],\n    {clue},\n    ["z{k + 1}", {args}]],\n'
        for k, clue in enumerate(clues)
    ]
    seed = (
        f'{lst("norwegian", w(), w(), w(), w())}, {lst(w(), w(), w(), w(), w())}, '
        f'{lst(w(), w(), "milk", w(), w())}, {lst(w(), w(), w(), w(), w())}, '
        f'{lst(w(), w(), w(), w(), w())}'
    )
    db = (
        "type DB = [\n"
        '  [["ix", Var<"X">, ["cons", Var<"X">, Var<"T0">], Var<"Y">, ["cons", Var<"Y">, Var<"U0">]]],\n'
        '  [["ix", Var<"X">, ["cons", Var<"H0">, Var<"T0">], Var<"Y">, ["cons", Var<"H1">, Var<"U0">]], ["ix", Var<"X">, Var<"T0">, Var<"Y">, Var<"U0">]],\n'
        '  [["r2", Var<"X">, ["cons", Var<"X">, Var<"T0">], Var<"Y">, ["cons", Var<"H0">, ["cons", Var<"Y">, Var<"U0">]]]],\n'
        '  [["r2", Var<"X">, ["cons", Var<"H0">, Var<"T0">], Var<"Y">, ["cons", Var<"H1">, Var<"U0">]], ["r2", Var<"X">, Var<"T0">, Var<"Y">, Var<"U0">]],\n'
        '  [["n2", Var<"X">, Var<"Xs">, Var<"Y">, Var<"Ys">], ["r2", Var<"X">, Var<"Xs">, Var<"Y">, Var<"Ys">]],\n'
        '  [["n2", Var<"X">, Var<"Xs">, Var<"Y">, Var<"Ys">], ["r2", Var<"Y">, Var<"Ys">, Var<"X">, Var<"Xs">]],\n'
        + "".join(stages)
        + f'  [["z{n}", {args}]],\n'
        f'  [["zebra", Var<"Who">], ["z0", {seed}, Var<"Who">]],\n'
        "];\n"
    )
    return (
        db + 'type Out = QueryM<["zebra", Var<"Who">], DB>;\n'
        'type _c = Expect<Equal<Out["length"] extends number ? true : false, true>>;\n'
    )


# staged flat-conjunction: same DB as p_flat, but the run is pumped through
# a chain of type aliases, one fuel chunk per alias
def p_staged(n):
    stages = n * 3 // 512 + 6
    db = f'type DB = [\n  [["t"]],\n  [["main"], {", ".join(chr(91) + chr(34) + "t" + chr(34) + chr(93) for _ in range(n))}],\n];\n'
    chain = 'type S0 = PumpStart<["main"], DB>;\n' + "".join(
        f"type S{i + 1} = Pump<S{i}, 1>;\n" for i in range(stages)
    )
    return (
        'import type { Pump, PumpStart } from "../../../src/04-machine";\n'
        + db + chain
        + f'type _c = Expect<Equal<S{stages} extends readonly unknown[] ? S{stages}["length"] : "unfinished", 1>>;\n'
    )


def p_stagedchain(n):
    stages = n * n // 300 + 8
    facts = "".join(f'  [["par", "n{i}", "n{i + 1}"]],\n' for i in range(n))
    db = (
        "type DB = [\n" + facts +
        '  [["anc", Var<"X">, Var<"Y">], ["par", Var<"X">, Var<"Y">]],\n'
        '  [["anc", Var<"X">, Var<"Z">], ["par", Var<"X">, Var<"Y">], ["anc", Var<"Y">, Var<"Z">]],\n'
        "];\n"
    )
    chain = 'type S0 = PumpStart<["anc", "n0", Var<"X">], DB>;\n' + "".join(
        f"type S{i + 1} = Pump<S{i}, 1>;\n" for i in range(stages)
    )
    return (
        'import type { Pump, PumpStart } from "../../../src/04-machine";\n'
        + db + chain
        + f'type _c = Expect<Equal<S{stages} extends readonly unknown[] ? S{stages}["length"] : "unfinished", {n}>>;\n'
    )


# full 14-clue zebra4 DB pumped through n Pump aliases
def p_zebra5(n):
    src = p_zebra4(14)
    db = src[: src.index("type Out")]
    chain = 'type S0 = PumpStart<["zebra", Var<"Who">], DB>;\n' + "".join(
        f"type S{i + 1} = Pump<S{i}, 1>;\n" for i in range(n)
    )
    return (
        'import type { Pump, PumpStart } from "../../../src/04-machine";\n'
        + db + chain
        + f'type _c = Expect<Equal<S{n} extends readonly unknown[] ? S{n} : "unfinished", '
        f'[["zebra", "german"]]>>;\n'
    )


# wrap any QueryM probe source in a Pump alias chain; the QueryM line is
# replaced by staged evaluation of the same goal
def stagedify(src, goal, stages, check):
    db = src[: src.index("type Out")]
    chain = f"type S0 = PumpStart<{goal}, DB>;\n" + "".join(
        f"type S{i + 1} = Pump<S{i}, 1>;\n" for i in range(stages)
    )
    return (
        'import type { Pump, PumpStart } from "../../../src/04-machine";\n'
        + db + chain
        + f'type Fin = S{stages} extends readonly unknown[] ? S{stages} : "unfinished";\n'
        + check
    )


QSTAGES = {5: 16, 6: 40, 7: 120, 8: 400}


def p_stagedqueens(n):
    return stagedify(
        p_queens(n), '["queens", Var<"Qs">]', QSTAGES[n],
        f'type _c = Expect<Equal<Fin extends readonly unknown[] ? Fin["length"] : Fin, {QCOUNT[n]}>>;\n',
    )


def p_stagednrev(n):
    return stagedify(
        p_nrev(n), '["nrev", ' + cons([f"e{i}" for i in range(1, n + 1)]) + ', Var<"R">]',
        n * n // 100 + 12,
        'type _c = Expect<Equal<Fin extends readonly unknown[] ? Fin["length"] : Fin, 1>>;\n',
    )


# union-datalog transitive closure over an n-edge chain: closure holds
# n(n+1)/2 pairs, racing the 100k union-size cap and the join budget
def p_dltc(n):
    edges = " | ".join(f'["e{i}", "e{i + 1}"]' for i in range(n))
    return (
        'import type { TC } from "../../../src/09-datalog";\n'
        f"type E = {edges};\n"
        f'type _c = Expect<Equal<["e0", "e{n}"] extends TC<E> ? true : false, true>>;\n'
    )


PROBES = {
    "dltc": p_dltc,
    "zebra3": p_zebra3,
    "zebra4": p_zebra4,
    "staged": p_staged,
    "stagedchain": p_stagedchain,
    "zebra5": p_zebra5,
    "stagedqueens": p_stagedqueens,
    "stagednrev": p_stagednrev,
    "parsedeep": p_parsedeep,
    "parselong": p_parselong,
    "zebra": p_zebra,
    "zebra2": p_zebra2,
    "chain": p_chain,
    "nrev": p_nrev,
    "flat": p_flat,
    "sum": p_sum,
    "diff": p_diff,
    "deep": p_deep,
    "queens": p_queens,
    "mult": p_mult,
    "div": p_div,
    "between": p_between,
}


def run(name, n):
    src = HEADER + PROBES[name](n)
    f = GEN / f"{name}.{n}.{ENGINE}.ts"
    f.write_text(src)
    t0 = time.time()
    status = "pass"
    rss_mb = None
    try:
        r = subprocess.run(
            ["/usr/bin/time", "-l", "npx", "tsgo", "--noEmit", "--strict",
             "--ignoreConfig", str(f)],
            capture_output=True, text=True, timeout=TIMEOUT, cwd=ROOT,
        )
        out = r.stdout + r.stderr
        m = re.search(r"(\d+)\s+maximum resident set size", out)
        if m:
            rss_mb = round(int(m.group(1)) / 1e6, 1)
        if r.returncode != 0:
            codes = sorted(set(re.findall(r"error (TS\d+)", out)))
            status = "+".join(codes) if codes else f"exit{r.returncode}"
    except subprocess.TimeoutExpired:
        status = "timeout"
    ms = int((time.time() - t0) * 1000)
    rec = {"probe": name, "n": n, "ms": ms, "rss_mb": rss_mb, "status": status,
           "engine": ENGINE}
    with RESULTS.open("a") as fh:
        import json
        fh.write(json.dumps(rec) + "\n")
    print(rec)
    return status == "pass"


def main():
    name = sys.argv[1]
    if sys.argv[2] == "--bisect":
        lo, hi = int(sys.argv[3]), int(sys.argv[4])
        assert run(name, lo), f"lo={lo} must pass"
        if run(name, hi):
            print(f"{name}: hi={hi} still passes")
            return
        while hi - lo > 1:
            mid = (lo + hi) // 2
            if run(name, mid):
                lo = mid
            else:
                hi = mid
        print(f"{name}: last pass n={lo}, first fail n={hi}")
    else:
        for n in sys.argv[2:]:
            run(name, int(n))


if __name__ == "__main__":
    main()
