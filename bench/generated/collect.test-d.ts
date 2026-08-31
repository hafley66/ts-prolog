import type { Var } from "../../src/01-term";
import type { QueryM } from "../../src/04-machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["par", "tom", "bob"]],
  [["par", "tom", "liz"]],
  [["par", "tom", "ann"]],
  [["par", "bob", "pat"]],
  [["plen", "nil", "z"]],
  [["plen", ["cons", Var<"H">, Var<"T">], ["s", Var<"N">]], ["plen", Var<"T">, Var<"N">]],
  [["who", "tom"]],
  [["who", "bob"]],
  [["who", "liz"]],
  [
    ["kids", Var<"P">, Var<"L">, Var<"N">],
    ["findall", Var<"X">, ["par", Var<"P">, Var<"X">], Var<"L">],
    ["plen", Var<"L">, Var<"N">],
  ],
  [["row", Var<"P">, Var<"L">, Var<"N">], ["who", Var<"P">], ["kids", Var<"P">, Var<"L">, Var<"N">]],
];
type Out = QueryM<["row", Var<"P">, Var<"L">, Var<"N">], DB>;
type Want = [
  ["row", "tom", ["cons", "bob", ["cons", "liz", ["cons", "ann", "nil"]]], ["s", ["s", ["s", "z"]]]],
  ["row", "bob", ["cons", "pat", "nil"], ["s", "z"]],
  ["row", "liz", "nil", "z"],
];
type _match = Expect<Equal<Out, Want>>;
