import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("Golang runner for evaluating binary expressions", () => {
  const singleLinebinaryExprTestCases = [
    {
      program: `
      package main
      
      func main() {
        return 1 + 2
      }`,
      expected: 3,
    },
    {
      program: `
      package main
      
      func main() {
        return 10 * 2 / 5
      }`,
      expected: 4.0,
    },
    // Add more test cases here
  ];

  test.each(singleLinebinaryExprTestCases)(
    "evaluate program with a single line of binary expr: %s",
    async ({ program, expected }) => {
      const actual = await golangRunner.execute(program);
      expect(actual.value).toEqual(expected);
    }
  );

  test("evaluate program with multiple lines of binary expr should return the result of the last evaluated expr", async () => {
    const program = `
    package main
    
    func main() {
      10 * 2 / 5
      33 - 13
      return 10 * 7 - 5
    }`;
    const actual = await golangRunner.execute(program);
    const expected = 65;
    expect(actual.value).toEqual(expected);
  });
});
