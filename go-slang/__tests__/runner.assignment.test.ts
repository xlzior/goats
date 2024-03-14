import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("Golang runner for evaluating definition statements", () => {
  // test definition from all expression types
  const simpleDefinitionTestCases = [
    {
      program: `
      package main
  
      func main() {
        x := 5
        return x
      }`,
      expected: 5,
    },
    {
      program: `
      package main
  
      func main() {
        x := 5 + 2
        return x
      }`,
      expected: 7,
    },
    {
      program: `
      package main
  
      func main() {
        x := -5
        return x
      }`,
      expected: -5,
    },
    {
      program: `
      package main
  
      func main() {
        x := (5 + 2 * 3)
        return x
      }`,
      expected: 11,
    },
    {
      program: `
      package main
  
      func main() {
        x := 5
        y := x
        return y
      }`,
      expected: 5,
    },
    {
      program: `
      package main

      func add(a, b int) int {
        return a + b
      }
  
      func main() {
        x := add(5, 7)
        return x
      }`,
      expected: 12,
    },
  ];

  test.each(simpleDefinitionTestCases)(
    "evaluate program with a simple definition: %s",
    async ({ program, expected }) => {
      const actual = await golangRunner.execute(program);
      expect(actual.value).toEqual(expected);
    },
  );

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
});

describe("Golang runner for evaluating assignment statements", () => {
  // test assignment from all expression types
  const simpleAssignmentTestCases = [
    {
      program: `
      package main
  
      func main() {
        x := 0
        x = 5
        return x
      }`,
      expected: 5,
    },
    {
      program: `
      package main
  
      func main() {
        x := 0
        x = 5 + 2
        return x
      }`,
      expected: 7,
    },
    {
      program: `
      package main
  
      func main() {
        x := 0
        x = -5
        return x
      }`,
      expected: -5,
    },
    {
      program: `
      package main
  
      func main() {
        x := 0
        x = (5 + 2 * 3)
        return x
      }`,
      expected: 11,
    },
    {
      program: `
      package main
  
      func main() {
        x := 5
        y := 0
        y = x
        return y
      }`,
      expected: 5,
    },
    {
      program: `
      package main

      func add(a, b int) int {
        return a + b
      }
  
      func main() {
        x := 0
        x = add(5, 7)
        return x
      }`,
      expected: 12,
    },
  ];

  test.each(simpleAssignmentTestCases)(
    "evaluate program with a simple assignment: %s",
    async ({ program, expected }) => {
      const actual = await golangRunner.execute(program);
      expect(actual.value).toEqual(expected);
    },
  );

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
});
