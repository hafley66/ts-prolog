import type { Var } from "../src/01-term";
import type { QueryM } from "../src/04-machine";
import type { Equal, Expect } from "../tests/util";

type DB = [
  [["col", "users", "id", "number"]],
  [["col", "users", "name", "string"]],
  [["col", "posts", "id", "number"]],
  [["col", "posts", "author_id", "number"]],
  [["fk", "posts", "author_id", "users"]],
  [["joinable", Var<"A">, Var<"B">], ["fk", Var<"A">, Var<"C">, Var<"B">]],
  [["joinable", Var<"A">, Var<"B">], ["fk", Var<"B">, Var<"C">, Var<"A">]],
];

type TyMap = { number: number; string: string };

type RowOf<Answers, Acc = {}> = Answers extends [
  [string, string, infer C extends string, infer Ty extends keyof TyMap],
  ...infer Rest,
]
  ? RowOf<Rest, Acc & { [K in C]: TyMap[Ty] }>
  : { [K in keyof Acc]: Acc[K] };

// row type derived by querying the schema facts
type Row<T extends string> = RowOf<QueryM<["col", T, Var<"C">, Var<"Ty">], DB>>;

type _users = Expect<Equal<Row<"users">, { id: number; name: string }>>;
type _posts = Expect<Equal<Row<"posts">, { id: number; author_id: number }>>;

type CanJoin<A extends string, B extends string> = QueryM<
  ["joinable", A, B],
  DB
> extends []
  ? false
  : true;

declare function join<A extends string, B extends string>(
  a: A,
  b: B,
  ...proof: CanJoin<A, B> extends true ? [] : [never]
): Row<A> & Row<B>;

join("posts", "users");
join("users", "posts"); // reverse direction via second joinable rule

// @ts-expect-error no foreign key between users and users
join("users", "users");
