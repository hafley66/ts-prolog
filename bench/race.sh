#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p bench/out
: > bench/results.jsonl

ms() { python3 -c 'import time; print(int(time.time()*1000))'; }

declare -a problems=(splits chain peano)

for p in "${problems[@]}"; do
  s=$(ms)
  swipl -q -g main -t halt "bench/progs/$p.pl" > "bench/out/$p.jsonl"
  swi_ms=$(( $(ms) - s ))
  echo "$p swipl ${swi_ms}ms $(wc -l < "bench/out/$p.jsonl" | tr -d ' ') answers"
  echo "{\"problem\":\"$p\",\"engine\":\"swipl\",\"ms\":$swi_ms}" >> bench/results.jsonl
done

python3 bench/gen_ts.py

for p in "${problems[@]}"; do
  s=$(ms)
  ok=0
  npx tsgo --noEmit --strict --ignoreConfig "bench/generated/$p.test-d.ts" > /dev/null 2>&1 || ok=$?
  tsgo_ms=$(( $(ms) - s ))
  echo "$p tsgo ${tsgo_ms}ms verified=$([ $ok -eq 0 ] && echo true || echo false)"
  echo "{\"problem\":\"$p\",\"engine\":\"tsgo\",\"ms\":$tsgo_ms,\"verified\":$([ $ok -eq 0 ] && echo true || echo false)}" >> bench/results.jsonl
done
