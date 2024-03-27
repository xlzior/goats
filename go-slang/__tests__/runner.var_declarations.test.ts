import { GolangRunner } from "../src";
import { strip_quotes } from "../src/utils";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

const typeToDefaultValues: [string, number | string | boolean][] = [
  ["int", 0],
  ["bool", false],
  ["string", ""],
];

describe("Golang runner for evaluating global variable declarations at the top level", () => {
  test.each(typeToDefaultValues)(
    `Type %s with default value %s`,
    async (type, defaultValue) => {
      const program = `
      package main

      var x ${type}

      func main() {
          return x
      }`;

      const { value } = await golangRunner.execute(program);
      expect(value).toEqual(defaultValue);
    },
  );
});

const typeToInitialisedValues: [string, number | string | boolean][] = [
  ["int", 100],
  ["bool", true],
  ["string", '"hello"'],
];

describe("Golang runner for evaluating global variable initialisations at the top level", () => {
  test.each(typeToInitialisedValues)(
    `Type %s with initialised value %s`,
    async (type, initialisedValue) => {
      const program = `
      package main

      var x ${type} = ${initialisedValue}

      func main() {
          return x
      }`;

      const { value } = await golangRunner.execute(program);
      expect(value).toEqual(strip_quotes(initialisedValue));
    },
  );
});

describe("Golang runner for evaluating global variable declarations with different combinations", () => {
  test("evaluate multiple initialisations in a single line", async () => {
    const program = `
    package main

    var x, y = 1,2
  
    func main() {
      return x * 100 + y
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 102;
    expect(value).toEqual(expected);
  });

  test("evaluate multiple initialisations in multiple lines", async () => {
    const program = `
    package main

    var (
      x = 1
      y = 2
    )
  
    func main() {
      return x * 100 + y
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 102;
    expect(value).toEqual(expected);
  });

  test("evaluate int initialisation and updated afterwards, should return updated value", async () => {
    const program = `
    package main

    var balance int = 100;
  
    func main() {
      balance += 200
      balance += 300
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 600;
    expect(value).toEqual(expected);
  });

  test("evaluate variable mutated by various functions", async () => {
    const program = `
    package main

    var balance = 100;

    func f1() {
      balance -= 10;
    }

    func f2() {
      balance += 50
    }
  
    func main() {
      f1()
      f2()
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 140;
    expect(value).toEqual(expected);
  });
});

describe("Golang runner for evaluating variable declarations at a function level", () => {
  // slightly different AST
  test("evaluate int declaration, should return default value of 0", async () => {
    const program = `
    package main
  
    func main() {
      var balance int;
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 0;
    expect(value).toEqual(expected);
  });

  test("evaluate int initialisation, should return initialised value", async () => {
    const program = `
    package main
  
    func main() {
      var balance = 333;
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 333;
    expect(value).toEqual(expected);
  });
});
