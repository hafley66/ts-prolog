import type { Var } from "../src/term";
import type { Query } from "../src/solve";
import type { Equal, Expect } from "./util";

type X = Var<"X">;
type Y = Var<"Y">;
type Z = Var<"Z">;

type DB = [
  [["parent", "tom", "bob"]],
  [["parent", "tom", "liz"]],
  [["parent", "bob", "ann"]],
  [["parent", "bob", "pat"]],
  [["grandparent", X, Z], ["parent", X, Y], ["parent", Y, Z]],
  [["ancestor", X, Y], ["parent", X, Y]],
  [["ancestor", X, Z], ["parent", X, Y], ["ancestor", Y, Z]],
];

type _fact = Expect<
  Equal<Query<["parent", "tom", "bob"], DB>, [["parent", "tom", "bob"]]>
>;
type _fact_fail = Expect<Equal<Query<["parent", "tom", "ann"], DB>, []>>;

type _enum_children = Expect<
  Equal<
    Query<["parent", "bob", Var<"Kid">], DB>,
    [["parent", "bob", "ann"], ["parent", "bob", "pat"]]
  >
>;

type _grandparent = Expect<
  Equal<
    Query<["grandparent", "tom", Var<"Who">], DB>,
    [["grandparent", "tom", "ann"], ["grandparent", "tom", "pat"]]
  >
>;

type _ancestor_backward = Expect<
  Equal<
    Query<["ancestor", Var<"A">, "ann"], DB>,
    [["ancestor", "bob", "ann"], ["ancestor", "tom", "ann"]]
  >
>;

type _ancestor_all = Expect<
  Equal<
    Query<["ancestor", "tom", Var<"D">], DB>,
    [
      ["ancestor", "tom", "bob"],
      ["ancestor", "tom", "liz"],
      ["ancestor", "tom", "ann"],
      ["ancestor", "tom", "pat"],
    ]
  >
>;
