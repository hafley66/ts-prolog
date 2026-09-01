import type { InCycle, DirectEdges, Reaches, SubEdges, UsesEdges } from "../src/09-datalog";
import type { Equal, Expect } from "../tests/util";

// the fact base is the TypeScript type graph itself: assignability probed
// over a registry, then datalog over the probed edges. No parsing anywhere.
interface Animal {
  name: string;
}
interface Dog extends Animal {
  bark(): void;
}
interface Puppy extends Dog {
  chew(): void;
}
interface Cat extends Animal {
  meow(): void;
}

type Reg = { animal: Animal; dog: Dog; puppy: Puppy; cat: Cat };

type _edges = Expect<
  Equal<
    SubEdges<Reg>,
    ["dog", "animal"] | ["puppy", "dog"] | ["puppy", "animal"] | ["cat", "animal"]
  >
>;

// Hasse diagram: assignability is transitive, so subtract every 2-hop
// composite to recover the declared inheritance hierarchy
type _hierarchy = Expect<
  Equal<
    DirectEdges<SubEdges<Reg>>,
    ["dog", "animal"] | ["puppy", "dog"] | ["cat", "animal"]
  >
>;
type _supertypes = Expect<Equal<Reaches<SubEdges<Reg>, "puppy">, "dog" | "animal">>;

// service graph traced from property and method-return types; datalog
// finds the dependency cycle at compile time
interface Db {
  q(sql: string): number;
}
interface Repo {
  db: Db;
  find(id: string): number;
}
interface Api {
  repo: Repo;
}
interface Alpha {
  beta(): Beta;
}
interface Beta {
  alpha: Alpha;
}

type Services = { db: Db; repo: Repo; api: Api; alpha: Alpha; beta: Beta };

type _uses = Expect<
  Equal<
    UsesEdges<Services>,
    ["repo", "db"] | ["api", "repo"] | ["alpha", "beta"] | ["beta", "alpha"]
  >
>;
type _api_deps = Expect<Equal<Reaches<UsesEdges<Services>, "api">, "repo" | "db">>;
type _circular = Expect<Equal<InCycle<UsesEdges<Services>>, "alpha" | "beta">>;
