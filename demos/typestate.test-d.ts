import type { Var } from "../src/01-term";
import type { QueryM } from "../src/04-machine";

type L<T extends readonly unknown[]> = T extends readonly [infer H, ...infer R]
  ? ["cons", H, L<R>]
  : "nil";

type S = Var<"S">;
type S2 = Var<"S2">;

type DB = [
  [["step", "closed", "open", "opened"]],
  [["step", "opened", "read", "opened"]],
  [["step", "opened", "close", "closed"]],
  [["run", S, "nil"]],
  [
    ["run", S, ["cons", Var<"Op">, Var<"Rest">]],
    ["step", S, Var<"Op">, S2],
    ["run", S2, Var<"Rest">],
  ],
];

type Legal<Ops extends readonly string[]> = QueryM<
  ["run", "closed", L<Ops>],
  DB
> extends []
  ? false
  : true;

declare function exec<Ops extends readonly string[]>(
  ops: [...Ops],
  ...proof: Legal<Ops> extends true ? [] : [never]
): void;

exec(["open", "read", "read", "close"]);
exec([]);

// @ts-expect-error read before open
exec(["read"]);
// @ts-expect-error double open: no step(opened, open, _)
exec(["open", "open"]);
// @ts-expect-error read after close
exec(["open", "close", "read"]);
