import type { Var } from "../../src/term";
import type { QueryM } from "../../src/machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["eq", Var<"X">, Var<"X">]],
  [["mem", Var<"X">, ["cons", Var<"X">, Var<"T">]]],
  [["mem", Var<"X">, ["cons", Var<"H">, Var<"T">]], ["mem", Var<"X">, Var<"T">]],
  [["right", Var<"X">, Var<"Y">, ["cons", Var<"X">, ["cons", Var<"Y">, Var<"R">]]]],
  [["right", Var<"X">, Var<"Y">, ["cons", Var<"H">, Var<"T">]], ["right", Var<"X">, Var<"Y">, Var<"T">]],
  [
    ["puzzle", Var<"Who">],
    ["eq", Var<"Hs">, ["cons", ["h", "norwegian", Var<"A1">, Var<"A2">], ["cons", ["h", Var<"B1">, Var<"B2">, Var<"B3">], ["cons", ["h", Var<"C1">, Var<"C2">, Var<"C3">], "nil"]]]],
    ["mem", ["h", "brit", "red", Var<"D1">], Var<"Hs">],
    ["mem", ["h", "spaniard", Var<"E1">, "dog"], Var<"Hs">],
    ["right", ["h", Var<"F1">, "red", Var<"F2">], ["h", Var<"G1">, "green", Var<"G2">], Var<"Hs">],
    ["mem", ["h", Var<"I1">, "blue", "cat"], Var<"Hs">],
    ["mem", ["h", Var<"Who">, Var<"J1">, "fish"], Var<"Hs">],
  ],
];
export type Out = QueryM<["puzzle", Var<"Who">], DB>;
