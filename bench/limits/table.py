#!/usr/bin/env python3
"""Ceiling matrix from results.jsonl: max passing n per probe x engine."""
import json
import pathlib
import sys

rows = [
    json.loads(l)
    for l in (pathlib.Path(__file__).parent / "results.jsonl").read_text().splitlines()
    if l
]
only = sys.argv[1:] or None
best = {}
for r in rows:
    if only and r["probe"] not in only:
        continue
    key = (r["probe"], r.get("engine", "v4"))
    if r["status"] == "pass":
        cur = best.get(key)
        if cur is None or r["n"] > cur:
            best[key] = r["n"]

engines = sorted({e for _, e in best}, key=lambda e: (e != "v4", e))
probes = sorted({p for p, _ in best})
w = max(len(p) for p in probes) + 2
print("probe".ljust(w) + "".join(e.rjust(8) for e in engines))
for p in probes:
    print(p.ljust(w) + "".join(str(best.get((p, e), "-")).rjust(8) for e in engines))
