import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("Golang runner for evaluating assignment statements", () => {
  test("evaluate simple assignment statement", async () => {
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

  test("evaluate simple re-assignment statement", async () => {
    const program = `
    package main
  
    func main() {
      x := 5
      x = 10
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 10;
    expect(value).toEqual(expected);
  });

  test("= should fail if there is no existing variable", async () => {
    const program = `
    package main
  
    func main() {
      x = 5
      return x
    }`;
    const result = await golangRunner.execute(program);
    expect("error" in result).toBeTruthy();
  });

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
});
