import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: { arity: 1, apply: println } });
});

describe("programs with waitgroups", () => {
  test("1 waitgroup", async () => {
    // Before - no waitgroup
    const programWithNoWaitgroup = `
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
      i := 30000
      for i > 0 {
        go deposit(1)
        go withdraw(1)
        i--
      }
      Sleep(2000)
      return balance
    }`;
    const { value: noWaitGroupValue } = await golangRunner.execute(
      programWithNoWaitgroup,
    );
    const expectedNoWaitGroup = 0;
    expect(noWaitGroupValue).not.toEqual(expectedNoWaitGroup);

    // After - with waitgroup
    const programWithWaitGroup = `
    package main

    var (
      balance int = 0
      mutex Mutex
      wg WaitGroup
    )

    func withdraw(amt int) {
      Lock(mutex)
      balance -= amt
      i := 5
      for i > 0 {
        i -= 1
      }
      Unlock(mutex)
      Done(wg)
    }

    func deposit(amt int) {
      Lock(mutex)
      balance += amt
      Unlock(mutex)
      Done(wg)
    }

    func main() {
      i := 30000
      for i > 0 {
        go deposit(1)
        go withdraw(1)
        Add(wg, 2)
        i--
      }
      Wait(wg)
      return balance
    }`;

    const { value: waitGroupValue } =
      await golangRunner.execute(programWithWaitGroup);
    const expectedWaitGroup = 0;
    expect(waitGroupValue).toEqual(expectedWaitGroup);
  });
});
