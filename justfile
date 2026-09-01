engine := "v4"
timeout := "240"

# list recipes
default:
    @just --list

# type-check everything with tsgo (fast lane)
check:
    npx tsgo --noEmit -p .

# type-check everything with stable tsc
check-tsc:
    npx tsc --noEmit -p .

# full race vs SWI: 12 problems, 3 lanes, timings into bench/results.jsonl
race:
    bash bench/race.sh

# run one probe at given sizes: just probe nrev 20 30 / just engine=v5 probe chain 40
probe name +ns:
    ENGINE={{engine}} PROBE_TIMEOUT={{timeout}} python3 bench/limits/probe.py {{name}} {{ns}}

# bisect a ceiling: just bisect nrev 6 60 (lo must pass, hi must fail)
bisect name lo hi:
    ENGINE={{engine}} PROBE_TIMEOUT={{timeout}} python3 bench/limits/probe.py {{name}} --bisect {{lo}} {{hi}}

# ceiling matrix, probe x engine, from all recorded runs (optionally filter: just table nrev chain)
table *probes:
    python3 bench/limits/table.py {{probes}}

# race timing table from the last race run
racetable:
    @python3 -c "import json,collections; d=collections.defaultdict(dict); \
    [d[r['problem']].__setitem__(r['engine'], (r['ms'], r.get('verified'))) for r in map(json.loads, open('bench/results.jsonl'))]; \
    print('problem'.ljust(10)+'swipl'.rjust(8)+'tsgo'.rjust(10)+'extract'.rjust(10)+'  verified'); \
    [print(p.ljust(10)+(str(v.get('swipl',['-'])[0])+'ms').rjust(8)+(str(v.get('tsgo',['-'])[0])+'ms').rjust(10)+(str(v.get('tsgo-extract',['-'])[0])+'ms').rjust(10)+('  yes' if v.get('tsgo',(0,False))[1] and v.get('tsgo-extract',(0,False))[1] else '  NO')) for p,v in d.items()]"
