import type { Var } from "../../src/01-term";
import type { Pump, PumpStart } from "../../src/04-machine";
import type { Equal, Expect } from "../../tests/util";

type DB = [
  [["ix", Var<"X">, ["cons", Var<"X">, Var<"T0">], Var<"Y">, ["cons", Var<"Y">, Var<"U0">]]],
  [["ix", Var<"X">, ["cons", Var<"H0">, Var<"T0">], Var<"Y">, ["cons", Var<"H1">, Var<"U0">]], ["ix", Var<"X">, Var<"T0">, Var<"Y">, Var<"U0">]],
  [["r2", Var<"X">, ["cons", Var<"X">, Var<"T0">], Var<"Y">, ["cons", Var<"H0">, ["cons", Var<"Y">, Var<"U0">]]]],
  [["r2", Var<"X">, ["cons", Var<"H0">, Var<"T0">], Var<"Y">, ["cons", Var<"H1">, Var<"U0">]], ["r2", Var<"X">, Var<"T0">, Var<"Y">, Var<"U0">]],
  [["n2", Var<"X">, Var<"Xs">, Var<"Y">, Var<"Ys">], ["r2", Var<"X">, Var<"Xs">, Var<"Y">, Var<"Ys">]],
  [["n2", Var<"X">, Var<"Xs">, Var<"Y">, Var<"Ys">], ["r2", Var<"Y">, Var<"Ys">, Var<"X">, Var<"Xs">]],
  [["z0", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["n2", "norwegian", Var<"Men">, "blue", Var<"Cols">],
    ["z1", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z1", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["r2", "green", Var<"Cols">, "white", Var<"Cols">],
    ["z2", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z2", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["ix", "green", Var<"Cols">, "coffee", Var<"Drinks">],
    ["z3", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z3", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["ix", "brit", Var<"Men">, "red", Var<"Cols">],
    ["z4", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z4", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["ix", "yellow", Var<"Cols">, "dunhill", Var<"Smokes">],
    ["z5", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z5", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["n2", "horse", Var<"Pets">, "dunhill", Var<"Smokes">],
    ["z6", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z6", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["ix", "dane", Var<"Men">, "tea", Var<"Drinks">],
    ["z7", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z7", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["ix", "beer", Var<"Drinks">, "bluemaster", Var<"Smokes">],
    ["z8", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z8", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["ix", "swede", Var<"Men">, "dog", Var<"Pets">],
    ["z9", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z9", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["ix", "german", Var<"Men">, "prince", Var<"Smokes">],
    ["z10", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z10", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["ix", "pallmall", Var<"Smokes">, "bird", Var<"Pets">],
    ["z11", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z11", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["n2", "blend", Var<"Smokes">, "cat", Var<"Pets">],
    ["z12", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z12", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["n2", "blend", Var<"Smokes">, "water", Var<"Drinks">],
    ["z13", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z13", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">],
    ["ix", Var<"Who">, Var<"Men">, "fish", Var<"Pets">],
    ["z14", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["z14", Var<"Men">, Var<"Cols">, Var<"Drinks">, Var<"Smokes">, Var<"Pets">, Var<"Who">]],
  [["zebra", Var<"Who">], ["z0", ["cons", "norwegian", ["cons", Var<"W1">, ["cons", Var<"W2">, ["cons", Var<"W3">, ["cons", Var<"W4">, "nil"]]]]], ["cons", Var<"W5">, ["cons", Var<"W6">, ["cons", Var<"W7">, ["cons", Var<"W8">, ["cons", Var<"W9">, "nil"]]]]], ["cons", Var<"W10">, ["cons", Var<"W11">, ["cons", "milk", ["cons", Var<"W12">, ["cons", Var<"W13">, "nil"]]]]], ["cons", Var<"W14">, ["cons", Var<"W15">, ["cons", Var<"W16">, ["cons", Var<"W17">, ["cons", Var<"W18">, "nil"]]]]], ["cons", Var<"W19">, ["cons", Var<"W20">, ["cons", Var<"W21">, ["cons", Var<"W22">, ["cons", Var<"W23">, "nil"]]]]], Var<"Who">]],
];
type S0 = PumpStart<["zebra", Var<"Who">], DB>;
type S1 = Pump<S0, 1>;
type S2 = Pump<S1, 1>;
type S3 = Pump<S2, 1>;
type S4 = Pump<S3, 1>;
type S5 = Pump<S4, 1>;
type S6 = Pump<S5, 1>;
type S7 = Pump<S6, 1>;
type S8 = Pump<S7, 1>;
type S9 = Pump<S8, 1>;
type S10 = Pump<S9, 1>;
type S11 = Pump<S10, 1>;
type S12 = Pump<S11, 1>;
type S13 = Pump<S12, 1>;
type S14 = Pump<S13, 1>;
type S15 = Pump<S14, 1>;
type S16 = Pump<S15, 1>;
type S17 = Pump<S16, 1>;
type S18 = Pump<S17, 1>;
type S19 = Pump<S18, 1>;
type S20 = Pump<S19, 1>;
type S21 = Pump<S20, 1>;
type S22 = Pump<S21, 1>;
type S23 = Pump<S22, 1>;
type S24 = Pump<S23, 1>;
type S25 = Pump<S24, 1>;
type S26 = Pump<S25, 1>;
type S27 = Pump<S26, 1>;
type S28 = Pump<S27, 1>;
type S29 = Pump<S28, 1>;
type S30 = Pump<S29, 1>;
export type Out = S30;
