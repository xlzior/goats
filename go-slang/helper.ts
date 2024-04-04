// can be run using
// npx ts-node helper.ts

import { GolangRunner } from "./src";
import { BuiltinFunction } from "./src/types";

const external_builtins: Record<string, BuiltinFunction> = {
  Println: {
    arity: 1,
    apply: (v: any) => console.log(v),
  },
};
const runner = new GolangRunner(external_builtins);
const program = `
package main

func add(x int) int {
  return 2;
}

func main() {
  x := 10
  for x > 0 {
    Println(x)
    x -= 1
  }
  PrintOS()
  return 1;
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
