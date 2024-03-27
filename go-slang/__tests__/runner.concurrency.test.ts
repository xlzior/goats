import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: { arity: 1, apply: println } });
});

describe("concurrent programs", () => {
  test("sleep", async () => {
    const program = `
    package main
  
    func main() {
      Println(1)
      Sleep(100)
      Println(2)
      Sleep(100)
      Println(3)
      Sleep(100)
      Println(4)
      Sleep(100)
      Println(5)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = undefined;
    expect(value).toEqual(expected);

    expect(println).toHaveBeenNthCalledWith(1, 1);
    expect(println).toHaveBeenNthCalledWith(2, 2);
    expect(println).toHaveBeenNthCalledWith(3, 3);
    expect(println).toHaveBeenNthCalledWith(4, 4);
    expect(println).toHaveBeenNthCalledWith(5, 5);
  });

  test("goroutines and interleaved execution", async () => {
    const program = `
    package main
  
    func thread(n int) {
      x := 0
      for x < 3 {
        Println(100 * n + x)
        x++
        Sleep(200)
      }
    }
    
    func main() {
      go thread(1)
      Sleep(100)
      go thread(2)
      Sleep(700)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = undefined;
    expect(value).toEqual(expected);

    expect(println).toHaveBeenNthCalledWith(1, 100);
    expect(println).toHaveBeenNthCalledWith(2, 200);
    expect(println).toHaveBeenNthCalledWith(3, 101);
    expect(println).toHaveBeenNthCalledWith(4, 201);
    expect(println).toHaveBeenNthCalledWith(5, 102);
    expect(println).toHaveBeenNthCalledWith(6, 202);
  });
});
