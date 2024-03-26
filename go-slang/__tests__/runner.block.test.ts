import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: { arity: 1, apply: println } });
});

describe("Golang runner for evaluating assignments in blocks", () => {
  test(":= in block should create a new variable, should not change existing one", async () => {
    const program = `
    package main
  
    func main() {
      x := 5
      {
        x := 10
      }
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 5;
    expect(value).toEqual(expected);
  });

  test("= should change existing variable in outer block, if it exists", async () => {
    const program = `
    package main
  
    func main() {
      x := 5
      {
        x = 10
      }
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 10;
    expect(value).toEqual(expected);
  });

  test("inner blocks can refer to variables defined outside", async () => {
    const program = `
    package main
  
    func main() {
      x := 5
      {
        return x
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 5;
    expect(value).toEqual(expected);
  });

  test("inner blocks can refer to and change variables from the outer scope", async () => {
    const program = `
    package main
  
    func main() {
      x := 5
      {
        x = x + 10
        return x
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 15;
    expect(value).toEqual(expected);
  });

  test("before defining x inside block, x in outer block can still be accessed", async () => {
    const program = `
    package main
  
    func main() {
      x := 10
      {
          Println(x)
          x := 45 + x
          Println(x)
      }
      Println(x + 20)
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenNthCalledWith(1, 10);
    expect(println).toHaveBeenNthCalledWith(2, 55);
    expect(println).toHaveBeenNthCalledWith(3, 30);
  });
});

describe("Golang runner for evaluating variable declarations in blocks", () => {
  test("same name redeclared using var in function level scope should return function level declaration value", async () => {
    const program = `
    package main

    var balance = 100
  
    func main() {
      var balance = 300
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 300;
    expect(value).toEqual(expected);
  });

  test("same name redeclared using := in function level scope should return function level declaration value", async () => {
    const program = `
    package main

    var balance = 100
  
    func main() {
      balance := 300
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 300;
    expect(value).toEqual(expected);
  });

});

describe("Golang runner for handling errors for assignments", () => {
  const ERROR = "error";

  test("Redefining the same variable in the same scope", async () => {
    const program = `
    package main

    func main() {
      a := 5
      a := 5
    }`;
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain("no new variables on left side of :=");
  });

  test("Redefining the same variables with multiple assignments in the same scope", async () => {
    const program = `
    package main

    func main() {
      a, b, c := 5, 6, 7
      a, b, c := 5, 6, 7
    }`;
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain("no new variables on left side of :=");
  });

  test.skip("Declaring a function with the same name in the same scope", async () => {
    const program = `
    package main

    func add(x int, y int) int {
      return x + y;
    }

    func add(x int, y int, z int) int {
      return x + y + z;
    }

    func main() {
      x := add(1,2)
      return x
    }`;
    const result = await golangRunner.execute(program);
    expect(result).toHaveProperty(ERROR);
    expect(result.error).toContain("add redeclared in this block");
  });
});
