import { GolangRunner } from "../src";
import { TypeError } from "../src/errors";

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
      wg WaitGroup
      balance = 0
    )

    func withdraw(amt int) {
      i := 0
      for i < amt {
        i++
        balance--
      }
      Done(wg)
    }

    func deposit(amt int) {
      i := 0
      for i < amt {
        i++
        balance++
      }
      Done(wg)
    }

    func main() {
      i := 300
      for i > 0 {
        Add(wg, 2)
        go deposit(100)
        go withdraw(100)
        i -= 1
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
      wg WaitGroup
      mutex Mutex
      balance = 0
    )
    
    func withdraw(amt int) {
      Lock(mutex)
      i := 0
      for i < amt {
        i++
        balance--
      }
      Unlock(mutex)
      Done(wg)
    }
    
    func deposit(amt int) {
      Lock(mutex)
      i := 0
      for i < amt {
        i++
        balance++
      }
      Unlock(mutex)
      Done(wg)
    }
    
    func main() {
      i := 300
      for i > 0 {
        Add(wg, 2)
        go deposit(100)
        go withdraw(100)
        i -= 1
      }
      Wait(wg)
      return balance
    }
    `;

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
      i := 0
      for i < amt {
        i++
        balance--
      }
      Unlock(mutex)
      Done(wg)
    }

    func deposit(amt int, mutex Mutex) {      
      Lock(mutex)
      i := 0
      for i < amt {
        i++
        balance++
      }
      Unlock(mutex)
      Done(wg)
    }

    func main() {
      var mutex Mutex
      i := 300
      for i > 0 {
        go deposit(100, mutex)
        go withdraw(100, mutex)
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
      i := 0
      for i < amt {
        i++
        balance1--
      }
      Unlock(mutex1)

      // mutex 2
      Lock(mutex2)
      j := 0
      for j < amt {
        j++
        balance2--
      }
      Unlock(mutex2)

      Done(wg)
    }

    func deposit(amt int) {
      // mutex 1
      Lock(mutex1)
      i := 0
      for i < amt {
        i++
        balance1++
      }
      Unlock(mutex1)

      // mutex2
      Lock(mutex2)
      j := 0
      for j < amt {
        j++
        balance2++
      }
      Unlock(mutex2)
      Done(wg)
    }

    func main() {
      i := 300
      for i > 0 {
        go deposit(100)
        go withdraw(100)
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

  test("reference equality", async () => {
    const program = `
    package main

    var (
      balance int = 0
      m1 Mutex
      m2 Mutex
      m3 = m1
      wg WaitGroup
    )

    func goroutine() {
      Lock(m1)
      balance += 1
      Unlock(m3)
      Done(wg)
    }
    
    func main() {
      m4 := m2

      Println(m1 == m1) // true
      Println(m1 == m2) // false
      Println(m1 == m3) // true
      Println(m2 == m4) // true

      Add(wg, 3)
      go goroutine()
      go goroutine()
      go goroutine()
      Wait(wg)

      return 1
    }
    `;
    const { value } = await golangRunner.execute(program);
    expect(value).toEqual(1);
    expect(println).toHaveBeenCalledTimes(4);
    expect(println).toHaveBeenNthCalledWith(1, true);
    expect(println).toHaveBeenNthCalledWith(2, false);
    expect(println).toHaveBeenNthCalledWith(3, true);
    expect(println).toHaveBeenNthCalledWith(4, true);
  });
});

describe("typechecker for mutex", () => {
  test("incorrect number of args (0) passed into Lock function", async () => {
    const program = `
    package main

    func add() {
      Lock()
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "not enough arguments in call to Lock: have [], want [Mutex]",
    );
  });

  test("incorrect number of args (2) passed into Lock function", async () => {
    const program = `
    package main

    func add() {
      var x = 1
      var y = 2
      Lock(x, y)
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "too many arguments in call to Lock: have [int, int], want [Mutex]",
    );
  });

  test("incorrect number of args (0) passed into Unlock function", async () => {
    const program = `
    package main

    func add() {
      Unlock()
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "not enough arguments in call to Unlock: have [], want [Mutex]",
    );
  });

  test("incorrect number of args (2) passed into Unlock function", async () => {
    const program = `
    package main

    func add() {
      var x = 1
      var y = 2
      Unlock(x, y)
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "too many arguments in call to Unlock: have [int, int], want [Mutex]",
    );
  });

  test("incorrect type passed into Lock function", async () => {
    const program = `
    package main

    func add() {
      var x int = 33
      Lock(x)
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "Lock expects [Mutex], but got [int]",
    );
  });

  test("incorrect type passed into Unlock function", async () => {
    const program = `
    package main

    func add() {
      var x int = 33
      Unlock(x)
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "Unlock expects [Mutex], but got [int]",
    );
  });
});
