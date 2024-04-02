import { GolangRunner } from "../src";
import { CompilationError, TypeError } from "../src/errors";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("functions", () => {
  test("main function is implicitly called and return value is returned", async () => {
    const program = `
    package main
  
    func main() {
      return 999
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 999;
    expect(value).toEqual(expected);
  });

  test("empty function", async () => {
    const program = `
    package main

    func add(a, b int) int {
      return a + b
    }

    func useless() int {
      
    }
  
    func main() {
      useless()
      useless()
      useless()
      useless()
      useless()
    }`;

    const result = await golangRunner.execute(program);
    expect(result.value).toBeUndefined();
    expect("error" in result).toBeFalsy();
  });

  test("function with no return", async () => {
    const program = `
    package main

    func add(a, b int) int {
      return a + b
    }

    func no_return() int {
      a := 5
      b := 10
      c := a * b + a + b
    }
  
    func main() {
      no_return()
      a := add(5, 7)
      no_return()
      no_return()
      no_return()
      b := add(3, 7)
      no_return()
      no_return()
      return a * b
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 120;
    expect(value).toEqual(expected);
  });

  test("function with return but no value", async () => {
    const program = `
    package main

    func add(a, b int) int {
      return a + b
    }

    func no_return_value() int {
      a := 5
      b := 10
      c := a * b + a + b
      return
    }
  
    func main() {
      no_return_value()
      a := add(5, 7)
      no_return_value()
      no_return_value()
      no_return_value()
      b := add(3, 7)
      no_return_value()
      no_return_value()
      return a * b
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 120;
    expect(value).toEqual(expected);
  });

  test("simple function with parameters and return value", async () => {
    const program = `
    package main

    func add(a, b int) int {
      return a + b
    }
  
    func main() {
      return add(5, 7)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 12;
    expect(value).toEqual(expected);
  });

  test("function with more complex parameters and return value", async () => {
    const program = `
    package main

    func add(a, b int) int {
      return a + b
    }

    func square(x int) int {
      return x * x
    }
  
    func main() {
      return 10 * add(5 * 3 + 1, square(square(2)))
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 320;
    expect(value).toEqual(expected);
  });

  test("multiple function calls", async () => {
    const program = `
    package main

    func square(x int) int {
      return x * x
    }
    
    func cube(x int) int {
      return x * x * x
    }

    func main() {
      return square(2) + cube(2)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 12;
    expect(value).toEqual(expected);
  });

  test("recursive function", async () => {
    const program = `
    package main

    func factorial(n int) int {
      if n <= 1 {
        return 1
      }
      return n * factorial(n-1)
    }
  
    func main() {
      return factorial(6)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 720;
    expect(value).toEqual(expected);
  });

  test("nested function calls", async () => {
    const program = `
    package main

    func first() int {
      return second()
    }

    func second() int {
      return 3
    }
  
    func main() {
      return first()
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 3;
    expect(value).toEqual(expected);
  });
});

describe("handling errors for functions", () => {
  test("Calling a variable as a function", async () => {
    const program = `
    package main

    func main() {
      add := 1;
      y := add(1,2)
      return y
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(
      CompilationError,
    );
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "invalid operation: cannot call non-function",
    );
  });

  test("Calling an undefined function", async () => {
    const program = `
    package main

    func main() {
      x := add(1,2)
      return x
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(
      CompilationError,
    );
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "undefined: add",
    );
  });

  test("Passing too little arguments to a function", async () => {
    const program = `
    package main

    func add(x int, y int) int {
      return x + y;
    }

    func main() {
      x := add(1)
      return x
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "not enough arguments in function call",
    );
  });

  test("Passing too many arguments to a function", async () => {
    const program = `
    package main

    func add(x int, y int) int {
      return x + y;
    }

    func main() {
      x := add(1,2,3)
      return x
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "too many arguments in function call",
    );
  });

  test("Passing wrong argument type to a function", async () => {
    const program = `
    package main

    func add(x int, y int) int {
      return x + y;
    }

    func main() {
      x := add(1, "hello")
      return x
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      'cannot use "hello" as int value in argument to add',
    );
  });

  test("Declaring a function with different return type", async () => {
    const program = `
    package main

    func add(x int) string {
      return 1;
    }

    func main() {
      return 1
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "add: cannot use [int] as [string] value in return statement",
    );
  });

  test("Declaring a function with more declared return types", async () => {
    const program = `
    package main

    func add(x int) (string, int, string) {
      return 1;
    }

    func main() {
      return 1
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "not enough return values: have [int], want [string, int, string]",
    );
  });

  test("Declaring a function with more actual return types", async () => {
    const program = `
    package main

    func add(x int) (int) {
      return 1, 2, 3;
    }

    func main() {
      return 1
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "too many return values: have [int, int, int], want [int]",
    );
  });

  test("Declaring a function with declared return type but no return stmt", async () => {
    const program = `
    package main

    func add(x int) (int) {
      1 + 3
    }

    func main() {
      return 1
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "add: missing return",
    );
  });

  test("Declaring a function with no declared return type but have return stmt", async () => {
    const program = `
    package main

    func add(x int) {
      return 1 + 3
    }

    func main() {
      return 1
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "too many return values: have [int], want []",
    );
  });
});
