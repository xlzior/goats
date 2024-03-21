import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("Golang runner for evaluating definition statements", () => {
  test("evaluate simple definition statement", async () => {
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

  test("evaluate multiple definition statement", async () => {
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

  test("evaluate multiple definition from function", async () => {
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

  test("evaluate multiple definition from other variables", async () => {
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

describe("Golang runner for evaluating assignment statements", () => {
  test("evaluate simple assignment statement", async () => {
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

  test("evaluate multiple assignment statement", async () => {
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

  test("evaluate multiple assignment from function", async () => {
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

  test("evaluate multiple assignment from other variables", async () => {
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

  test("evaluate multiple assignment from same variables", async () => {
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

  test("evaluate multiple assignment from same variables with binary expression", async () => {
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
    const result = await golangRunner.execute(program);
    expect("error" in result).toBeTruthy();
  });

  const compoundAssignTestCases = [
    {
      program: `
      package main
      
      func main() {
        x := 5
        x += 5
        return x
      }`,
      expected: 10,
    },
    {
      program: `
      package main
      
      func main() {
        x := 5
        x -= 5
        return x
      }`,
      expected: 0,
    },
    {
      program: `
      package main
      
      func main() {
        x := 5
        x *= 5
        return x
      }`,
      expected: 25,
    },
    {
      program: `
      package main
      
      func main() {
        x := 5
        x /= 5
        return x
      }`,
      expected: 1.0,
    },
    {
      program: `
      package main
      
      func main() {
        x := 5
        x %= 2
        return x
      }`,
      expected: 1,
    },
  ];

  test.each(compoundAssignTestCases)(
    "evaluate program with a compound assignment: %s",
    async ({ program, expected }) => {
      const actual = await golangRunner.execute(program);
      expect(actual.value).toEqual(expected);
    },
  );

  test("evaluate increment by one operator", async () => {
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

  test("evaluate decrement by one operator", async () => {
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

describe("Golang runner error handling for assignments", () => {

  const ERROR = "error" // error property in result

  test("redefining the same variable", async () => {
    const program = `
    package main

    func main() {
      a := 5
      a := 5
    }`;
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain(
      "no new variables on left side of :=",
    );
  });

  test("redefining the same variable with multiple define", async () => {
    const program = `
    package main

    func main() {
      a, b, c := 5, 6, 7
      a, b, c := 5, 6, 7
    }`;
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain(
      "no new variables on left side of :=",
    );
  });

  test("assignment mismatch - LHS has more variables", async () => {
    const program = `
    package main

    func main() {
      a, b := 1
    }`;
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain(
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
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain(
      "assignment mismatch: 3 variables but addOne returns 2 values",
    );
  });

  test("assignment mismatch - RHS has more values", async () => {
    const program = `
    package main

    func main() {
      a := 1, 2
    }`;
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain(
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
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain(
      "assignment mismatch: 1 variable but addOne returns 2 values",
    );
  });

  test("assigning variable without initialisation using :=", async () => {
    const program = `
    package main

    func main() {
      a = 10;
    }`;
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain(
      "undefined: a",
    );
  });

  test("missing value on RHS of :=", async () => {
    const program = `
    package main

    func main() {
      a :=
    }`;
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain(
      "expected operand, found '}'",
    );
  });

})