import type { Query } from "../src/05-parse";
import type { Done } from "./done";

type Rules = [
  "not(G) :- G, !, fail",
  "not(G2)",
  "edge(fetch, build)",
  "edge(build, test)",
  "edge(test, deploy)",
  "root(fetch)",
  "ready(X) :- root(X), not(done(X))",
  "ready(X) :- edge(D, X), done(D), not(done(X))",
];

export type Out = Query<"ready(A)", [...Rules, ...Done]>;
