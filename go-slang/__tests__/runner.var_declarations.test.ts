import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("Golang runner for evaluating global variable declarations at the top level", () => {
  test("evaluate int declaration, should return default value of 0", async () => {
    const program = `
    package main

    var balance int;
  
    func main() {
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 0;
    expect(value).toEqual(expected);
  });

  test("evaluate string declaration, should return default value of empty string", async () => {
    const program = `
    package main

    var accountName string;
  
    func main() {
      return accountName
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "";
    expect(value).toEqual(expected);
  });

  test("evaluate bool declaration, should return default value of false", async () => {
    const program = `
    package main

    var is_created bool;
  
    func main() {
      return is_created
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = false;
    expect(value).toEqual(expected);
  });

  test("evaluate multiple int declarations, should return default value of 0", async () => {
    const program = `
    package main

    var (
      x int
      y int
      z int
    )
  
    func main() {
      return x + y + z
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 0;
    expect(value).toEqual(expected);
  });

  test("evaluate int initialisation, should return initialised value", async () => {
    const program = `
    package main

    var balance int = 100;
  
    func main() {
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 100;
    expect(value).toEqual(expected);
  });

  test("evaluate string initialisation, should return initialised value", async () => {
    const program = `
    package main

    var accountName string = "Personal";
  
    func main() {
      return accountName
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "Personal";
    expect(value).toEqual(expected);
  });

  test("evaluate bool initialisation, should return initialised value", async () => {
    const program = `
    package main

    var is_created bool = true;
  
    func main() {
      return is_created
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = true;
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
});

describe("Golang runner for evaluating global variable declarations at the function level", () => {
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

  test("evaluate string declaration, should return default value of empty string", async () => {
    const program = `
    package main
  
    func main() {
      var accountName string;
      return accountName
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "";
    expect(value).toEqual(expected);
  });

  test("evaluate bool declaration, should return default value of false", async () => {
    const program = `
    package main
  
    func main() {
      var is_created bool;
      return is_created
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = false;
    expect(value).toEqual(expected);
  });

  test("evaluate multiple int declarations, should return default value of 0", async () => {
    const program = `
    package main
  
    func main() {
      var (
        x int
        y int
        z int
      )
      return x + y + z
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 0;
    expect(value).toEqual(expected);
  });

  test("evaluate int initialisation, should return initialised value", async () => {
    const program = `
    package main
  
    func main() {
      var balance int = 100;
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 100;
    expect(value).toEqual(expected);
  });

  test("evaluate string initialisation, should return initialised value", async () => {
    const program = `
    package main
  
    func main() {
      var accountName string = "Personal";
      return accountName
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "Personal";
    expect(value).toEqual(expected);
  });

  test("evaluate bool initialisation, should return initialised value", async () => {
    const program = `
    package main
  
    func main() {
      var is_created bool = true;
      return is_created
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = true;
    expect(value).toEqual(expected);
  });

  test("evaluate int initialisation and updated afterwards, should return updated value", async () => {
    const program = `
    package main
  
    func main() {
      var balance int = 100;
      balance += 200
      balance += 300
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 600;
    expect(value).toEqual(expected);
  });
});
