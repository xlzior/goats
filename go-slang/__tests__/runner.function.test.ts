import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("Golang runner for evaluating functions", () => {
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

    func first() {
      return second()
    }

    func second() {
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
