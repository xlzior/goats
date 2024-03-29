import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: { arity: 1, apply: println } });
});

describe("mutex", () => {
  test("1 mutex", async () => {
    // Before - no mutex
    const programWithNoMutex = `
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
      Sleep(2000)
      return balance
    }`;
    const { value: valWithNoMutex } =
      await golangRunner.execute(programWithNoMutex);
    const expectedValWithNoMutex = 0;
    expect(valWithNoMutex).not.toEqual(expectedValWithNoMutex);

    // After - with mutex
    const programWithMutex = `
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
      Sleep(7000)
      return balance
    }`;

    const { value: valWithMutex } =
      await golangRunner.execute(programWithMutex);
    const expectedValWithMutex = 0;
    expect(valWithMutex).toEqual(expectedValWithMutex);
  });
});
