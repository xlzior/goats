// can be run using
// npx ts-node helper.ts

import { GolangRunner } from "./src";
import { BuiltinFunction } from "./src/types";

const external_builtins: Record<string, BuiltinFunction> = {
  Println: {
    arity: 1,
    apply: (v: any) => console.log("Go program printed:", v),
  },
};
const runner = new GolangRunner(external_builtins);
const program = `
package main

func add(a, b int) int {
  return a + b
}

func no_return() {
  a := 5
  b := 10
  c := a * b + a + b
}

func main() {
  no_return()
  a := add(5, 7)
  no_return()
  no_return()
  no_return()
  b := add(3, 7)
  no_return()
  no_return()
  return a * b
}
`;

console.log("Running Go program:");
runner
  .execute(program)
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });
