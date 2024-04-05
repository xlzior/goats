import { GolangRunner } from "../src";
import { TypeError } from "../src/errors";

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

    func useless() {
      
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

    func no_return() {
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

    func no_return_value() {
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

  test("higher order function - function receive another function as argument", async () => {
    const program = `
    package main

    func add(a int, b int) int {
      return a + b
    }

    func applyFunc(x, y int, f func(int, int) int) int {
      x := f(x, y)
      return x
    }
  
    func main() {
      result := applyFunc(3, 5, add)
      return result
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 8;
    expect(value).toEqual(expected);
  });

  test("higher order function - function return another function", async () => {
    const program = `
    package main

    func add(n int) int {
      return n + 1
    }
    
    func proxy() func(int) int {
      x := "all i do is to return another function"
      return add
    }
  
    func main() {
      fn := proxy()
      res := fn(2)
      return res
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
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
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
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
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
      "not enough arguments in call to add",
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
      "too many arguments in call to add",
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
      "add expects [int, int], but got [int, string]",
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
      "add: not enough return values: have [int], want [string, int, string]",
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

  test("Higher order function receiving function arg with mismatched argument count", async () => {
    const program = `
    package main

    func add(a int, b int) int {
      return a + b
    }

    func applyFunc(x, y, z int, f func(int, int, int) int) int {
      x := f(x, y, z)
      return x
    }
  
    func main() {
      result := applyFunc(3, 5, 8, add)
      return result
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "applyFunc expects [int, int, int, [int, int, int] -> [int]], but got [int, int, int, [int, int] -> [int]]",
    );
  });

  test("Higher order function return function type mismatch", async () => {
    const program = `
    package main

    func add(n int) int {
      return n + 1
    }
    
    func proxy() func(int, int) int {
      x := "all i do is to return another function"
      return add
    }
  
    func main() {
      fn := proxy()
      res := fn(2)
      return res
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "proxy: cannot use [[int] -> [int]] as [[int, int] -> [int]] value in return statement",
    );
  });
});

describe("typechecking if statements in functions", () => {
  test("should continue to typecheck after return statement in if block", async () => {
    const program = `
    package main
  
    func main() {
      x := 7
      if (x < 5) {
        return 100
      }
      "hello" + 1
      return -1
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "+ expects [int, int] or [string, string], but got [string, int]",
    );
  });

  test("should continue to typecheck even if there is return in both if and else branches", async () => {
    const program = `
    package main

    func foo() int {
      if (true) {
        return 1
      } else {
        return 2
      }
      return 1,2,3
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: too many return values: have [int, int, int], want [int]",
    );
  });

  test("missing return because of missing else statement", async () => {
    const program = `
    package main
  
    func foo() int {
      if (true) {
        return 1
      }
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: missing return",
    );
  });

  test("missing return because of missing else statement", async () => {
    const program = `
    package main
  
    func foo() int {
      if (true) {
        return 1
      } else if (false) {
        return 2
      }
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: missing return",
    );
  });

  test("missing return in deeply-nested conditional statement", async () => {
    const program = `
    package main

    func foo() int {
      x := 7
      if (x < 5) {
        return 100
      } else {
        if (x == 5) {
          return 200
        } else {
          if (x == 6) {

          } else {
            return 400
          }
        }
      }
    }

    func main() {
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: missing return",
    );
  });

  test("return statement in if block which does not match function return type", async () => {
    const program = `
    package main

    func foo() int {
      if (true) {
        return "hello"
      }
      return 1
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: cannot use [string] as [int] value in return statement",
    );
  });

  test("return statement in else if block which does not match function return type", async () => {
    const program = `
    package main

    func foo() int {
      if (true) {
        return 1
      } else if (false) {
        return "hello"
      }
      return 1
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: cannot use [string] as [int] value in return statement",
    );
  });

  test("return statement in else block which does not match function return type", async () => {
    const program = `
    package main

    func foo() int {
      if (true) {
        return 1
      } else {
        return "hello"
      }
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: cannot use [string] as [int] value in return statement",
    );
  });

  test("return undefined in if in function with return type", async () => {
    const program = `
    package main

    func foo() int {
      if (true) {
        return
      } else {
        return 1
      }
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: not enough return values: have [], want [int]",
    );
  });

  test("return undefined in else if in function with return type", async () => {
    const program = `
    package main

    func foo() int {
      if (true) {
        return 1
      } else if (false) {
        return
      } else {
        return 3
      }
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: not enough return values: have [], want [int]",
    );
  });

  test("return undefined in else in function with return type", async () => {
    const program = `
    package main

    func foo() int {
      if (true) {
        return 1
      } else {
        return
      }
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: not enough return values: have [], want [int]",
    );
  });

  test("return non-undefined in if in function with no return type", async () => {
    const program = `
    package main

    func foo() {
      if (true) {
        return 1
      } else {
        return
      }
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: too many return values: have [int], want []",
    );
  });

  test("return non-undefined in else if in function with no return type", async () => {
    const program = `
    package main

    func foo() {
      if (true) {
        return 
      } else if false {
        return 1,2,3
      } else {
        return
      }
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: too many return values: have [int, int, int], want []",
    );
  });

  test("return non-undefined in else in function with no return type", async () => {
    const program = `
    package main

    func foo() {
      if (true) {
        return 
      } else if false {
        return
      } else {
        return "hello"
      }
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: too many return values: have [string], want []",
    );
  });

  test("return non-undefined with no else in function with no return type", async () => {
    const program = `
    package main

    func foo() {
      if (true) {
        return 
      } else if false {
        return
      }
      return 1 + 2
    }

    func main() {

    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: too many return values: have [int], want []",
    );
  });
});

describe("typechecking while statements in functions", () => {
  test("missing return in function even if while loop has return stmt ", async () => {
    const program = `
    package main

    func foo() int {
      i := 10
      for i > 0 {
        return i
      }
    }

    func main() {
      foo()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: missing return",
    );
  });

  test("missing return in function even if while loop has return stmt in if branch", async () => {
    const program = `
    package main

    func foo() int {
      i := 10
      for i > 0 {
        if i == 5 {
          return 100
        }
        i -= 1
      }
    }

    func main() {
      foo()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: missing return",
    );
  });

  test("missing return in function even if while loop has return stmt in else branch", async () => {
    const program = `
    package main

    func foo() int {
      i := 10
      for i > 0 {
        if i == 5 {
          a := 6
        } else {
          return 200
        }
        i -= 1
      }
    }

    func main() {
      foo()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: missing return",
    );
  });

  test("missing return in function even if while loop has return stmt in both conditional branches", async () => {
    const program = `
    package main

    func foo() int {
      i := 10
      for i > 0 {
        if i == 5 {
          return 100
        } else {
          return 200
        }
        i -= 1
      }
    }

    func main() {
      foo()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: missing return",
    );
  });

  test("missing return in function even if while loop inside an if stmt has return stmt", async () => {
    const program = `
    package main

    func foo() int {
      x := 1
      if x > 1 {
        i := 5 
        for i > 0 {
          return i
        }
      } else {
        return 4
      }
    }

    func main() {
      foo()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "foo: missing return",
    );
  });

  test("should not throw error when function contains return statement outside of while loop", async () => {
    const program = `
    package main

    func foo() int {
      i := 10
      for i > 0 {
        if i == 5 {
          return 100
        } else {
          return 200
        }
        i -= 1
      }
      return 300
    }

    func main() {
      foo()
    }`;
    await expect(golangRunner.execute(program)).resolves.not.toThrow(TypeError);
  });
});
