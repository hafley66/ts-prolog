import type { Var } from "../src/01-term";
import type { QueryM } from "../src/04-machine";

type L<T extends readonly unknown[]> = T extends readonly [infer H, ...infer R]
  ? ["cons", H, L<R>]
  : "nil";

type X = Var<"X">;

type DB = [
  [["deps", "db", "nil"]],
  [["deps", "logger", "nil"]],
  [["deps", "api", L<["db", "logger"]>]],
  [["deps", "worker", L<["api", "queue"]>]],
  [["wired", X], ["deps", X, Var<"Ds">], ["allwired", Var<"Ds">]],
  [["allwired", "nil"]],
  [
    ["allwired", ["cons", Var<"H">, Var<"T">]],
    ["wired", Var<"H">],
    ["allwired", Var<"T">],
  ],
];

type Wired<Svc extends string> = QueryM<["wired", Svc], DB> extends []
  ? false
  : true;

declare function resolve<Svc extends string>(
  svc: Svc,
  ...proof: Wired<Svc> extends true ? [] : [never]
): void;

resolve("db");
resolve("api"); // transitively wired: db + logger

// @ts-expect-error worker needs queue, which has no deps fact
resolve("worker");
// @ts-expect-error unknown service
resolve("cache");
