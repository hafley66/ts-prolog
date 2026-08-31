#!/usr/bin/env python3
"""Compare answers extracted from the type checker against SWI's JSONL."""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent


def uncons(t):
    out = []
    while t != "nil":
        out.append(t[1])
        t = t[2]
    return out


def unpeano(t):
    n = 0
    while t != "z":
        n += 1
        t = t[1]
    return n


def normalize(problem, answer):
    if problem == "splits":
        return {"a": uncons(answer[1]), "b": uncons(answer[2])}
    if problem == "chain":
        return {"x": answer[2]}
    if problem == "peano":
        return {"a": unpeano(answer[1]), "b": unpeano(answer[2])}
    if problem == "hanoi":
        return {"moves": [[m[1], m[2]] for m in uncons(answer[5])]}
    if problem == "perm":
        return {"p": uncons(answer[2])}
    if problem == "color":
        return {"c": answer[1:7]}
    if problem == "puzzle":
        return {"who": answer[1]}
    if problem == "collect":
        return {"p": answer[1], "kids": uncons(answer[2]), "n": unpeano(answer[3])}
    if problem == "queens":
        return {"q": uncons(answer[1])}
    if problem == "nrev":
        return {"r": uncons(answer[2])}
    raise ValueError(problem)


problem = sys.argv[1]
extracted = json.loads((ROOT / "out" / f"{problem}.ts5.json").read_text())
got = [normalize(problem, a) for a in extracted]
if problem == "queens":
    for w in [json.loads(l) for l in (ROOT / "out" / "queens.jsonl").read_text().splitlines() if l]:
        w["q"] = [int(x) for x in w["q"]]
want = [
    json.loads(l)
    for l in (ROOT / "out" / f"{problem}.jsonl").read_text().splitlines()
    if l
]
if got == want:
    print(f"{problem}: {len(got)} answers, exact match")
else:
    print(f"{problem}: MISMATCH\n got: {got}\nwant: {want}")
    sys.exit(1)
