import { GolangRunner } from "../src";
import { TypeError } from "../src/errors";

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

  test("reference equality", async () => {
    const program = `
    package main

    var (
      wg1 WaitGroup
      wg2 WaitGroup
      wg3 = wg1
    )

    func goroutine() {
      x := 1
      Done(wg3)
    }
    
    func main() {
      wg4 := wg2
      Println(wg1 == wg1) // true
      Println(wg1 == wg2) // false
      Println(wg1 == wg3) // true
      Println(wg2 == wg4) // true

      Add(wg1, 1)
      go goroutine()
      Wait(wg1)

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

describe("typechecker for waitgroups", () => {
  test("incorrect number of args (0) passed into Add function", async () => {
    const program = `
    package main
  
    func main() {
      Add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "not enough arguments in call to Add: have [], want [WaitGroup, int]",
    );
  });

  test("incorrect number of args (3) passed into Add function", async () => {
    const program = `
    package main
  
    func main() {
      Add(1,2,3)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "too many arguments in call to Add: have [int, int, int], want [WaitGroup, int]",
    );
  });

  test("incorrect number of args (0) passed into Wait function", async () => {
    const program = `
    package main
  
    func main() {
      Wait()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "not enough arguments in call to Wait: have [], want [WaitGroup]",
    );
  });

  test("incorrect number of args (2) passed into Wait function", async () => {
    const program = `
    package main
  
    func main() {
      Wait(1,2)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "too many arguments in call to Wait: have [int, int], want [WaitGroup]",
    );
  });

  test("incorrect number of args (0) passed into Done function", async () => {
    const program = `
    package main
  
    func main() {
      Done()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "not enough arguments in call to Done: have [], want [WaitGroup]",
    );
  });

  test("incorrect number of args (2) passed into Done function", async () => {
    const program = `
    package main
  
    func main() {
      Done(1,2)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "too many arguments in call to Done: have [int, int], want [WaitGroup]",
    );
  });

  test("incorrect type passed (only first arg) into Add function", async () => {
    const program = `
    package main

    func add() {
      var x int = 33
      Add(x, 1)
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "Add expects [WaitGroup, int], but got [int, int]",
    );
  });

  test("incorrect type passed (only second arg) into Add function", async () => {
    const program = `
    package main

    func add() {
      var mutex Mutex
      var x string = "hello"
      Add(mutex, x)
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "Add expects [WaitGroup, int], but got [Mutex, string]",
    );
  });

  test("incorrect type passed (both args) into Add function", async () => {
    const program = `
    package main

    func add() {
      var x bool = false
      var y string = "hello"
      Add(x, y)
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "Add expects [WaitGroup, int], but got [bool, string]",
    );
  });

  test("incorrect type passed into Wait function", async () => {
    const program = `
    package main

    func add() {
      var x int = 33
      Wait(x)
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "Wait expects [WaitGroup], but got [int]",
    );
  });

  test("incorrect type passed into Done function", async () => {
    const program = `
    package main

    func add() {
      var x int = 33
      Done(x)
    }
  
    func main() {
      add()
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      "Done expects [WaitGroup], but got [int]",
    );
  });
});
