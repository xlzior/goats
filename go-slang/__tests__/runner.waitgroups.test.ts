import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: { arity: 1, apply: println } });
});

describe("waitgroups", () => {
  test("single global waitgroup used to ensure all goroutines are executed", async () => {
    const program = `
    package main

    var wg WaitGroup

    func f1() {
      Println("goroutine 1")
      Done(wg)
    }

    func f2() {
      Println("goroutine 2")
      Done(wg)
    }

    func f3() {
      Println("goroutine 3")
      Done(wg)
    }

    func main() {

      Add(wg, 3)
      go f1()
      go f2()
      go f3()

      Wait(wg)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = undefined;
    expect(value).toEqual(expected);

    expect(println).toHaveBeenCalledWith("goroutine 1");
    expect(println).toHaveBeenCalledWith("goroutine 2");
    expect(println).toHaveBeenCalledWith("goroutine 3");
  });

  test("single waitgroup via parameter passing used to ensure all goroutines are executed", async () => {
    const program = `
    package main

    func f1(wg WaitGroup) {
      Println("goroutine 1")
      Done(wg)
    }

    func f2(wg WaitGroup) {
      Println("goroutine 2")
      Done(wg)
    }

    func f3(wg WaitGroup) {
      Println("goroutine 3")
      Done(wg)
    }

    func main() {

      var wg WaitGroup

      Add(wg, 3)
      go f1(wg)
      go f2(wg)
      go f3(wg)

      Wait(wg)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = undefined;
    expect(value).toEqual(expected);

    expect(println).toHaveBeenCalledWith("goroutine 1");
    expect(println).toHaveBeenCalledWith("goroutine 2");
    expect(println).toHaveBeenCalledWith("goroutine 3");
  });

  test("multiple global waitgroups used to ensure all goroutines are executed", async () => {
    const program = `
    package main

    var (
      wg1 WaitGroup
      wg2 WaitGroup
    )

    func f1() {
      Println("goroutine 1")
      Done(wg1)
    }

    func f2() {
      Println("goroutine 2")
      Done(wg1)
    }

    func f3() {
      Println("goroutine 3")
      Done(wg2)
    }

    func main() {

      Add(wg1, 2)
      Add(wg2, 1)
      go f1()
      go f2()
      go f3()

      Wait(wg1)
      Wait(wg2)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = undefined;
    expect(value).toEqual(expected);

    expect(println).toHaveBeenCalledWith("goroutine 1");
    expect(println).toHaveBeenCalledWith("goroutine 2");
    expect(println).toHaveBeenCalledWith("goroutine 3");
  });

  test("multiple waitgroups via parameter passing used to ensure all goroutines are executed", async () => {
    const program = `
    package main

    func f1(wg WaitGroup) {
      Println("goroutine 1")
      Done(wg)
    }

    func f2(wg WaitGroup) {
      Println("goroutine 2")
      Done(wg)
    }

    func f3(wg WaitGroup) {
      Println("goroutine 3")
      Done(wg)
    }

    func main() {

      var wg1 WaitGroup
      var wg2 WaitGroup

      Add(wg1, 2)
      go f1(wg1)
      go f2(wg1)

      Add(wg2, 1)
      go f3(wg2)

      Wait(wg1)
      Wait(wg2)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = undefined;
    expect(value).toEqual(expected);

    expect(println).toHaveBeenCalledWith("goroutine 1");
    expect(println).toHaveBeenCalledWith("goroutine 2");
    expect(println).toHaveBeenCalledWith("goroutine 3");
  });
});
