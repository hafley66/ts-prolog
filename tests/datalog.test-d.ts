import type { DirectEdges, InCycle, Reaches, TC } from "../src/09-datalog";
import type { Equal, Expect } from "./util";

// facts are a plain union: no strings, no Var, no machine, no parsing
type Par = ["tom", "bob"] | ["tom", "liz"] | ["bob", "ann"] | ["ann", "pat"];

type _anc = Expect<
  Equal<
    TC<Par>,
    | Par
    | ["tom", "ann"]
    | ["tom", "pat"]
    | ["bob", "pat"]
  >
>;
type _desc = Expect<Equal<Reaches<Par, "bob">, "ann" | "pat">>;

// covering relation: closure minus every 2-hop composite recovers the input
type _hasse = Expect<Equal<DirectEdges<TC<Par>>, Par>>;

// set semantics: acyclic input has no cycle members; closing the loop puts
// every node on the cycle through it
type _acyclic = Expect<Equal<InCycle<Par>, never>>;
type _cycle = Expect<
  Equal<InCycle<Par | ["pat", "tom"]>, "tom" | "bob" | "ann" | "pat">
>;
