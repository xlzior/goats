import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: println });
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
