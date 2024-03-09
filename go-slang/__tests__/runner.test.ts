import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("Golang runner for evaluating binary expressions", () => {
  const binaryExprTestCases = [
    {
      program: 'package main\n\nimport "fmt"\n\nfunc main() {\n\t1 + 2\n}',
      expected: 3,
    },
    {
      program: 'package main\n\nimport "fmt"\n\nfunc main() {\n\t10 * 2 / 5\n}',
      expected: 4.0,
    },
    // Add more test cases here
  ];

  test.each(binaryExprTestCases)(
    "evaluate binary expr: %s",
    async ({ program, expected }) => {
      const actual = await golangRunner.execute(program);
      expect(actual).toEqual(expected);
    }
  );
});
