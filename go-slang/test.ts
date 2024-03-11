// can be run using
// npx ts-node test.ts

import { GolangRunner } from "./src";

const runner = new GolangRunner();
const program = `
package main

func add(a, b int) int {
  return a + b
}

func main() {
  num1 := 5
  num2 := 7
  result := add(num1, num2)
  Println(result)
}
`;
runner.execute(program).then((result) => console.log(result));
