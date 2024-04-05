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

func main() {
  Print_Heap()
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
