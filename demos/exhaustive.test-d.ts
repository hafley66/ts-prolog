import type { Var } from "../src/01-term";
import type { QueryM } from "../src/04-machine";
import type { Equal, Expect } from "../tests/util";

type AppEvent = "click" | "hover" | "keydown";

type FullDB = [
  [["handles", "click"]],
  [["handles", "hover"]],
  [["handles", "keydown"]],
];

type GappyDB = [[["handles", "click"]], [["handles", "hover"]]];

// answers tuple -> union of handled event names
type HandledIn<DB extends readonly unknown[]> = QueryM<
  ["handles", Var<"E">],
  DB
>[number] extends readonly [string, infer E]
  ? E
  : never;

type _covered = Expect<Equal<HandledIn<FullDB>, AppEvent>>;

// the gap is a type error naming the missing member
type _gap = Expect<Equal<HandledIn<GappyDB>, "click" | "hover">>;
type _gap_detected = Expect<
  Equal<Exclude<AppEvent, HandledIn<GappyDB>>, "keydown">
>;
