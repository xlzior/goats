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

func send(messages chan int) {
  Sleep(1000)
  messages <- 1
}

func main() {
  messages := make(chan int)
  go send(messages)
  msg := <-messages
  Println(msg)
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
