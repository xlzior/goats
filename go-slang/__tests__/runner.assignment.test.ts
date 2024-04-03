import { GolangRunner } from "../src";
import { CompilationError, SyntaxError, TypeError } from "../src/errors";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("definition statements", () => {
  test("simple definition statement", async () => {
    const program = `
    package main
  
    func main() {
      x := 5
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 5;
    expect(value).toEqual(expected);
  });

  test("multiple definition statement", async () => {
    const program = `
    package main
  
    func main() {
      x, y := 5, 10
      return x + y
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 15;
    expect(value).toEqual(expected);
  });

  test("multiple definition from function", async () => {
    const program = `
    package main

    func threeNumbers() (int, int, int) {
      return 1, 2, 3
    }

    func main() {
      a, b, c := threeNumbers()
      return a * 100 + b * 10 + c
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 123;
    expect(value).toEqual(expected);
  });

  test("multiple definition from other variables", async () => {
    const program = `
    package main

    func main() {
      a, b, c := 1, 2, 3
      x, y, z := c, b, a
      return x * 100 + y * 10 + z
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 321;
    expect(value).toEqual(expected);
  });

  test("redefining the same variables but has 1 new variable with multiple define should not error", async () => {
    const program = `
    package main

    func main() {
      a, b, c := 888, 999, 3
      a, b, d := 1, 2, 4
      return a + b + c + d
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 10;
    expect(value).toEqual(expected);
  });

  test("redefining the same variables but has 2 new variables with multiple define should not error", async () => {
    const program = `
    package main

    func main() {
      a, b, c := 888, 999, 3
      a, b, d, e := 1, 2, 4, 5
      return a + b + c + d + e
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 15;
    expect(value).toEqual(expected);
  });

  test("redefining the same variables with new variables with multiple define should not error in 1 level of nesting", async () => {
    const program = `
    package main

    func main() {
      a, b, c := 888, 999, 3
      a, b, d := 1, 2, 4
      {
        a, b, c := 123, 456, 30
        a, b, d := 11, 22, 44
        return a + b + c + d;
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 107;
    expect(value).toEqual(expected);
  });

  test("redefining the same variables with new variables with multiple define should not error in 2 levels of nesting", async () => {
    const program = `
    package main

    func main() {
      a, b, c := 888, 999, 3
      a, b, d := 1, 2, 4
      {
        a, b, c := 123, 456, 30
        a, b, d := 11, 22, 44
        {
          a, b, c := 33, 126, 931
          a, b, d := 1131, 2132, 13
          return a + b + c + d;
        }
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 4207;
    expect(value).toEqual(expected);
  });

  test("redefining the same variables with new variables with multiple define should not error in 3 levels of nesting", async () => {
    const program = `
    package main

    func main() {
      a, b, c := 888, 999, 3
      a, b, d := 1, 2, 4
      {
        a, b, c := 123, 456, 30
        a, b, d := 11, 22, 44
        {
          a, b, c := 33, 126, 931
          a, b, d := 1131, 2132, 13
          {
            a, b, c := 0, 1, 2
            a, b, d := 77, 88, 99
            return a + b + c + d
          }
        }
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 266;
    expect(value).toEqual(expected);
  });
});

describe("assignment statements", () => {
  test("simple assignment statement", async () => {
    const program = `
    package main
  
    func main() {
      x := 5
      x = 2
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 2;
    expect(value).toEqual(expected);
  });

  test("multiple assignment statement", async () => {
    const program = `
    package main
  
    func main() {
      x := 5
      y := 10
      x, y = 100, 200
      return x + y
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 300;
    expect(value).toEqual(expected);
  });

  test("multiple assignment from function", async () => {
    const program = `
    package main

    func threeNumbers() (int, int, int) {
      return 1, 2, 3
    }

    func main() {
      a, b, c := 6, 5, 4
      a, b, c = threeNumbers()
      return a * 100 + b * 10 + c
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 123;
    expect(value).toEqual(expected);
  });

  test("multiple assignment from other variables", async () => {
    const program = `
    package main

    func main() {
      a, b, c := 1, 2, 3
      x, y, z := 4, 5, 6
      x, y, z = c, b, a
      return x * 100 + y * 10 + z
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 321;
    expect(value).toEqual(expected);
  });

  test("multiple assignment from same variables", async () => {
    const program = `
    package main

    func main() {
      a := 1
      b := 5
      a, b = b, a
      return 10 * a + b
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 51;
    expect(value).toEqual(expected);
  });

  test("multiple assignment from same variables with binary expression", async () => {
    const program = `
    package main

    func main() {
      a := 1
      b := 5
      a, b = b + a, a
      return 10 * a + b
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 61;
    expect(value).toEqual(expected);
  });

  test("assignment should fail if there is no existing variable", async () => {
    const program = `
    package main
  
    func main() {
      x = 5
      return x
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(
      CompilationError,
    );
    await expect(golangRunner.execute(program)).rejects.toThrow("undefined: x");
  });

  const compoundAssignTestCases = [
    { a: 5, op: "+=", b: 5, expected: 10 },
    { a: 5, op: "-=", b: 5, expected: 0 },
    { a: 5, op: "*=", b: 5, expected: 25 },
    { a: 5, op: "/=", b: 5, expected: 1.0 },
    { a: 5, op: "%=", b: 2, expected: 1 },
  ];

  test.each(compoundAssignTestCases)(
    "a compound assignment: %s",
    async ({ a, op, b, expected }) => {
      const program = `
      package main
      
      func main() {
        x := ${a}
        x ${op} ${b}
        return x
      }`;
      const actual = await golangRunner.execute(program);
      expect(actual.value).toEqual(expected);
    },
  );

  test("increment by one operator", async () => {
    const program = `
    package main

    func main() {
      x := 10
      x++
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 11;
    expect(value).toEqual(expected);
  });

  test("decrement by one operator", async () => {
    const program = `
    package main

    func main() {
      x := 10
      x--
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 9;
    expect(value).toEqual(expected);
  });
});

describe("handling errors for assignments", () => {
  test("assignment mismatch - LHS has more variables", async () => {
    const program = `
    package main

    func main() {
      a, b := 1
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "assignment mismatch: 2 variables but 1 value",
    );
  });

  test("assignment mismatch - LHS has more values from function return", async () => {
    const program = `
    package main

    func addOne(x int, y int) (int, int) {
      return x + 1, y + 1
    }

    func main() {
      a, b, c := addOne(1,2)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "assignment mismatch: 3 variables but addOne returns 2 values",
    );
  });

  test("assignment mismatch - RHS has more values", async () => {
    const program = `
    package main

    func main() {
      a := 1, 2
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "assignment mismatch: 1 variable but 2 values",
    );
  });

  test("assignment mismatch - RHS has more values from function return", async () => {
    const program = `
    package main

    func addOne(x int, y int) (int, int) {
      return x + 1, y + 1
    }

    func main() {
      a := addOne(1,2)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "assignment mismatch: 1 variable but addOne returns 2 values",
    );
  });

  test("assigning variable without initialisation using :=", async () => {
    const program = `
    package main

    func main() {
      a = 10;
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow("undefined: a");
  });

  test("missing value on RHS of :=", async () => {
    const program = `
    package main

    func main() {
      a :=
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(SyntaxError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "expected operand, found '}'",
    );
  });

  test("Reassignment to a different type from initialised type", async () => {
    const program = `
    package main

    func main() {
      x := 10; // integer
      x = "hello" // string
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "cannot use string as int value in assignment",
    );
  });

  test("Increment operator invalid on non-indentifier type", async () => {
    const program = `
    package main

    func main() {
      1++
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "invalid operation ++ on non-identifier type",
    );
  });

  test("Increment operator invalid on string type", async () => {
    const program = `
    package main

    func main() {
      x := "hello"
      x++
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "invalid operation ++ on type string",
    );
  });

  test("Increment operator invalid on bool type", async () => {
    const program = `
    package main

    func main() {
      x := false
      x++
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "invalid operation ++ on type bool",
    );
  });

  test("Decrement operator invalid on non-indentifier type", async () => {
    const program = `
    package main

    func main() {
      1--
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "invalid operation -- on non-identifier type",
    );
  });

  test("Decrement operator invalid on string type", async () => {
    const program = `
    package main

    func main() {
      x := "hello"
      x--
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "invalid operation -- on type string",
    );
  });

  test("Decrement operator invalid on bool type", async () => {
    const program = `
    package main

    func main() {
      x := true
      x--
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "invalid operation -- on type bool",
    );
  });
});
