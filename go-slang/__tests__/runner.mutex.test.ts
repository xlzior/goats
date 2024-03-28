import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: { arity: 1, apply: println } });
});

describe("Golang runner for evaluating programs without mutex", () => {
  test("Due to interleaving of threads in random order, balance should be mutated to be a random value", async () => {
    const program = `
    package main

    var (
      balance int = 0
    )

    func withdraw(amt int) {
      balance -= amt
      i := 5
      for i > 0 {
        i -= 1
      }
    }

    func deposit(amt int) {
      balance += amt
    }

    func main() {
      i := 10000
      for i > 0 {
        go deposit(1)
        go withdraw(1)
        i--
      }
      Sleep(100)
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 0;
    expect(value).not.toEqual(expected);
  });
});

describe("Golang runner for evaluating programs with mutex", () => {
  test("With mutex control, balance should be deterministic with value of 0", async () => {
    const program = `
    package main

    var (
      balance int = 0
      mutex Mutex
    )

    func withdraw(amt int) {
      Lock(mutex)
      balance -= amt
      i := 5
      for i > 0 {
        i -= 1
      }
      Unlock(mutex)
    }

    func deposit(amt int) {
      Lock(mutex)
      balance += amt
      Unlock(mutex)
    }

    func main() {
      i := 10000
      for i > 0 {
        go deposit(1)
        go withdraw(1)
        i--
      }
      Sleep(100)
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 0;
    expect(value).toEqual(expected);
  });
});
