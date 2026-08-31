import type { Var } from "../src/term";
import type { QueryM } from "../src/machine";
import type { Equal, Expect } from "../tests/util";

// one shared logic var across goals IS the constraint solver
type DB = [
  [["supports", "pkgA", "v2"]],
  [["supports", "pkgA", "v3"]],
  [["supports", "pkgB", "v1"]],
  [["supports", "pkgB", "v2"]],
  [["supports", "pkgC", "v3"]],
  [
    ["pickAB", Var<"V">],
    ["supports", "pkgA", Var<"V">],
    ["supports", "pkgB", Var<"V">],
  ],
  [
    ["pickABC", Var<"V">],
    ["supports", "pkgA", Var<"V">],
    ["supports", "pkgB", Var<"V">],
    ["supports", "pkgC", Var<"V">],
  ],
];

type _ab = Expect<
  Equal<QueryM<["pickAB", Var<"V">], DB>, [["pickAB", "v2"]]>
>;

// no version satisfies all three: solver reports unsatisfiable as []
type _abc = Expect<Equal<QueryM<["pickABC", Var<"V">], DB>, []>>;

declare function install<V extends string>(
  version: V,
  ...proof: QueryM<["pickAB", V], DB> extends [] ? [never] : []
): void;

install("v2");

// @ts-expect-error v3 not supported by pkgB
install("v3");
