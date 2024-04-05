// can be run using
// npx ts-node run.ts < xxx.go

import { GolangRunner } from "../src";
import { BuiltinFunction } from "../src/types";

const external_builtins: Record<string, BuiltinFunction> = {
  Println: {
    arity: 1,
    apply: (v: any) => console.log(v),
  },
};
const runner = new GolangRunner(external_builtins);

process.stdin.setEncoding("utf8");
let program = "";
process.stdin.on("data", (chunk) => {
  program += chunk;
});

process.stdin.on("end", () => {
  runner
    .execute(program)
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      console.error(error);
    });
});
