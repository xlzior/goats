// can be run using
// npx ts-node run.ts < xxx.go > xxx.out
// npx ts-node run.ts < xxx.go --memory=1000
// npx ts-node run.ts < xxx.go --debug_os=true

import { GolangRunner } from "../src";
import { BuiltinFunction } from "../src/types";

const config: Record<string, string> = process.argv
  .slice(2)
  .reduce((acc, arg) => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    return match ? { ...acc, [match[1]]: match[2] } : acc;
  }, {});

const external_builtins: Record<string, BuiltinFunction> = {
  Println: {
    arity: 1,
    apply: (v: any) => console.log(v),
  },
};
const runner = new GolangRunner(external_builtins, config);

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
