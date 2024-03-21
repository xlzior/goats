// can be run using
// npx ts-node helper.ts

import { GolangRunner } from "./src";
import { BuiltinFunction } from "./src/types";

const builtin_mapping: Record<string, BuiltinFunction> = {
  Println: {
    arity: 1,
    apply: (v: any) => console.log("Go program printed:", v),
  },
};
const runner = new GolangRunner(builtin_mapping);
const program = `
package main
  
func thread(n int) {
  x := 0
  for x < 3 {
    Println(100 * n + x)
    x++
    Sleep(2000)
  }
}

func main() {
  go thread(1)
  Sleep(1000)
  go thread(2)
  Sleep(7000)
}
`;
runner.execute(program)
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });

