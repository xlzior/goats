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

  test("redefining the same variable should error", async () => {
    const program = `
    package main

    func main() {
      a := 5
      a := 5
    }`;
    const result = await golangRunner.execute(program);
    expect(result.error).toContain(
      "a has already been defined in this environment",
    );
  });

  test("redefining the same variable with multiple define should error", async () => {
    const program = `
    package main

    func main() {
      a, b, c := 5, 6, 7
      a, b, c := 5, 6, 7
    }`;
    const result = await golangRunner.execute(program);
    expect(result.error).toContain(
      "has already been defined in this environment",
    );
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
