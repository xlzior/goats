import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: { arity: 1, apply: println } });
});

describe("mutex", () => {
  test("program without mutex should produce balance with random value", async () => {
    const program = `
    package main

    var (
      balance int = 0
      wg WaitGroup
    )

    func withdraw(amt int) {
      balance -= amt
      i := 5
      for i > 0 {
        i -= 1
      }
      Done(wg)
    }

    func deposit(amt int) {
      balance += amt
      Done(wg)
    }

    func main() {
      i := 10000
      for i > 0 {
        go deposit(1)
        go withdraw(1)
        i--
        Add(wg, 2)
      }
      Wait(wg)
      return balance
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 0;
    expect(value).not.toEqual(expected);
  });

  test("program with 1 mutex defined by global var should produce balance with 0", async () => {
    const program = `
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
      i := 10000
      for i > 0 {
        go deposit(1)
        go withdraw(1)
        Add(wg, 2)
        i--
      }
      Wait(wg)
      return balance
    }`;

    const { value } = await golangRunner.execute(program);
    const expected = 0;
    expect(value).toEqual(expected);
  });

  test("program with 1 mutex used via parameter passing should produce balance with 0", async () => {
    const program = `
    package main

    var (
      balance int = 0
      wg WaitGroup
    )

    func withdraw(amt int, mutex Mutex) {
      Lock(mutex)
      balance -= amt
      i := 5
      for i > 0 {
        i -= 1
      }
      Unlock(mutex)
      Done(wg)
    }

    func deposit(amt int, mutex Mutex) {
      Lock(mutex)
      balance += amt
      Unlock(mutex)
      Done(wg)
    }

    func main() {
      var mutex Mutex
      i := 10000
      for i > 0 {
        go deposit(1, mutex)
        go withdraw(1, mutex)
        Add(wg, 2)
        i--
      }
      Wait(wg)
      return balance
    }`;

    const { value } = await golangRunner.execute(program);
    const expected = 0;
    expect(value).toEqual(expected);
  });

  test("program with 2 mutex defined by global var should produce balance with 0", async () => {
    const program = `
    package main

    var (
      balance1 int = 0
      balance2 int = 0
      mutex1 Mutex
      mutex2 Mutex
      wg WaitGroup
    )

    func withdraw(amt int) {
      // mutex 1
      Lock(mutex1)
      balance1 -= amt
      i := 5
      for i > 0 {
        i -= 1
      }
      Unlock(mutex1)

      // mutex 2
      Lock(mutex2)
      balance2 -= amt
      Unlock(mutex2)

      Done(wg)
    }

    func deposit(amt int) {
      // mutex 1
      Lock(mutex1)
      balance1 += amt
      Unlock(mutex1)

      // mutex2
      Lock(mutex2)
      balance2 += amt
      Unlock(mutex2)
      Done(wg)
    }

    func main() {
      i := 10000
      for i > 0 {
        go deposit(1)
        go withdraw(1)
        Add(wg, 2)
        i--
      }
      Wait(wg)
      return balance1 + balance2
    }`;

    const { value } = await golangRunner.execute(program);
    const expected = 0;
    expect(value).toEqual(expected);
  });
});
