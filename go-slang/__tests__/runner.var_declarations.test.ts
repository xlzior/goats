import { GolangRunner } from "../src";
import { strip_quotes } from "../src/utils";
import { DataType } from "../src/types/index";
import { TypeError } from "../src/errors";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

const typeToDefaultValues: [string, number | string | boolean][] = [
  [DataType.INT, 0],
  [DataType.BOOL, false],
  [DataType.STRING, ""],
];

describe("global variable declarations at the top level", () => {
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
  [DataType.INT, 100],
  [DataType.BOOL, true],
  [DataType.STRING, '"hello"'],
];

describe("global variable initialisations at the top level", () => {
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

describe("global variable declarations with different combinations", () => {
  test("multiple initialisations in a single line", async () => {
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

  test("multiple initialisations in multiple lines", async () => {
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

  test("int initialisation and updated afterwards, should return updated value", async () => {
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

  test("variable mutated by various functions", async () => {
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

describe("variable declarations at a function level", () => {
  // slightly different AST
  test("int declaration, should return default value of 0", async () => {
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

  test("int initialisation, should return initialised value", async () => {
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

describe("typecheck variable declarations", () => {
  test("var decl more init values than variables", async () => {
    const program = `
    package main
  
    func main() {
      var x int = 1,2,3
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "assignment mismatch: 1 variable but 3 values", // deviating from Go's err msg
    );
  });

  test("var decl more variables than init values", async () => {
    const program = `
    package main
  
    func main() {
      var a, b int = 1
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "assignment mismatch: 2 variables but 1 value",
    );
  });

  test("var decl with declaration and initialisation, but mismatch declared type and value", async () => {
    const program = `
    package main
  
    func main() {
      var x int = "hello"
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "cannot use string as int value in variable declaration",
    );
  });

  test("var decl with declaration, but reassign to different type", async () => {
    const program = `
    package main
  
    func main() {
      var x int
      x = true
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "cannot use bool as int value in assignment",
    );
  });

  test("var decl with initialisation without declared type, but reassign to different type", async () => {
    const program = `
    package main
  
    func main() {
      var x = "hello"
      x = 1
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "cannot use int as string value in assignment",
    );
  });

  test("multiple var decl with initialisation without declared type, but reassign to different type", async () => {
    const program = `
    package main
  
    func main() {
      var x,y int = "hello", 1
      x = 1
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "cannot use string as int value in variable declaration",
    );
  });
});
