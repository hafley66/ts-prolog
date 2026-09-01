import type { Var } from "../../src/01-term";
import type { QueryM } from "../../src/04-machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["sel", Var<"X">, ["cons", Var<"X">, Var<"T">], Var<"T">]],
  [["sel", Var<"X">, ["cons", Var<"H">, Var<"T">], ["cons", Var<"H">, Var<"R">]], ["sel", Var<"X">, Var<"T">, Var<"R">]],
  [["ok", Var<"Q0">, "nil", Var<"D0">]],
  [
    ["ok", Var<"Q">, ["cons", Var<"P">, Var<"Ps">], Var<"D">],
    ["plus", Var<"P">, Var<"D">, Var<"S1">],
    ["neq", Var<"S1">, Var<"Q">],
    ["plus", Var<"Q">, Var<"D">, Var<"S2">],
    ["neq", Var<"S2">, Var<"P">],
    ["plus", Var<"D">, 1, Var<"D2">],
    ["ok", Var<"Q">, Var<"Ps">, Var<"D2">],
  ],
  [["place", "nil", Var<"Acc">, Var<"Acc">]],
  [
    ["place", Var<"L">, Var<"Acc">, Var<"Qs">],
    ["sel", Var<"Q">, Var<"L">, Var<"R">],
    ["ok", Var<"Q">, Var<"Acc">, 1],
    ["place", Var<"R">, ["cons", Var<"Q">, Var<"Acc">], Var<"Qs">],
  ],
  [["queens", Var<"Qs">], ["place", ["cons", 1, ["cons", 2, ["cons", 3, ["cons", 4, ["cons", 5, "nil"]]]]], "nil", Var<"Qs">]],
];
type Out = QueryM<["queens", Var<"Qs">], DB>;
type Want = [
  ["queens", ["cons", 4, ["cons", 2, ["cons", 5, ["cons", 3, ["cons", 1, "nil"]]]]]],
  ["queens", ["cons", 3, ["cons", 5, ["cons", 2, ["cons", 4, ["cons", 1, "nil"]]]]]],
  ["queens", ["cons", 5, ["cons", 3, ["cons", 1, ["cons", 4, ["cons", 2, "nil"]]]]]],
  ["queens", ["cons", 4, ["cons", 1, ["cons", 3, ["cons", 5, ["cons", 2, "nil"]]]]]],
  ["queens", ["cons", 5, ["cons", 2, ["cons", 4, ["cons", 1, ["cons", 3, "nil"]]]]]],
  ["queens", ["cons", 1, ["cons", 4, ["cons", 2, ["cons", 5, ["cons", 3, "nil"]]]]]],
  ["queens", ["cons", 2, ["cons", 5, ["cons", 3, ["cons", 1, ["cons", 4, "nil"]]]]]],
  ["queens", ["cons", 1, ["cons", 3, ["cons", 5, ["cons", 2, ["cons", 4, "nil"]]]]]],
  ["queens", ["cons", 3, ["cons", 1, ["cons", 4, ["cons", 2, ["cons", 5, "nil"]]]]]],
  ["queens", ["cons", 2, ["cons", 4, ["cons", 1, ["cons", 3, ["cons", 5, "nil"]]]]]],
];
type _match = Expect<Equal<Out, Want>>;
