import type { Var } from "../../src/term";
import type { QueryM } from "../../src/machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["par", "n0", "n1"]],
  [["par", "n1", "n2"]],
  [["par", "n2", "n3"]],
  [["par", "n3", "n4"]],
  [["par", "n4", "n5"]],
  [["par", "n5", "n6"]],
  [["par", "n6", "n7"]],
  [["par", "n7", "n8"]],
  [["par", "n8", "n9"]],
  [["par", "n9", "n10"]],
  [["anc", Var<"X">, Var<"Y">], ["par", Var<"X">, Var<"Y">]],
  [["anc", Var<"X">, Var<"Z">], ["par", Var<"X">, Var<"Y">], ["anc", Var<"Y">, Var<"Z">]],
];
export type Out = QueryM<["anc", "n0", Var<"X">], DB>;
