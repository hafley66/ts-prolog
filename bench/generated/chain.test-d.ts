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
type Out = QueryM<["anc", "n0", Var<"X">], DB>;
type Want = [
  ["anc", "n0", "n1"],
  ["anc", "n0", "n2"],
  ["anc", "n0", "n3"],
  ["anc", "n0", "n4"],
  ["anc", "n0", "n5"],
  ["anc", "n0", "n6"],
  ["anc", "n0", "n7"],
  ["anc", "n0", "n8"],
  ["anc", "n0", "n9"],
  ["anc", "n0", "n10"],
];
type _match = Expect<Equal<Out, Want>>;
