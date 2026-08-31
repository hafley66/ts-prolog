import type { Var } from "../src/term";
import type { QueryM } from "../src/machine";

type R = Var<"R">;
type R2 = Var<"R2">;
type A = Var<"A">;

type DB = [
  [["inherits", "admin", "editor"]],
  [["inherits", "editor", "viewer"]],
  [["grant", "viewer", "read"]],
  [["grant", "editor", "write"]],
  [["grant", "admin", "delete"]],
  [["can", R, A], ["grant", R, A]],
  [["can", R, A], ["inherits", R, R2], ["can", R2, A]],
];

type Allowed<Role extends string, Act extends string> = QueryM<
  ["can", Role, Act],
  DB
> extends []
  ? false
  : true;

declare function act<Role extends string, Act extends string>(
  role: Role,
  action: Act,
  ...proof: Allowed<Role, Act> extends true ? [] : [never]
): void;

act("viewer", "read");
act("admin", "read"); // two inheritance hops
act("admin", "delete");

// @ts-expect-error viewer holds no delete grant, directly or by inheritance
act("viewer", "delete");
// @ts-expect-error editor cannot delete
act("editor", "delete");
