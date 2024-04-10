import { GolangRunner } from "../src";
import { RuntimeError } from "../src/errors";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

const expected_error = "Deadlock detected: All threads are blocked";

describe("deadlock detection with only one thread", () => {
  test("unbuffered channel send", async () => {
    const program = `
    package main
  
    func main() {
      x := make(chan int)
      x <- 5
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("unbuffered channel receive", async () => {
    const program = `
    package main
  
    func main() {
      x := make(chan int)
      <-x
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("buffered channel send", async () => {
    const program = `
    package main
  
    func main() {
      x := make(chan int, 1)
      x <- 5
      x <- 6
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("buffered channel receive", async () => {
    const program = `
    package main
  
    func main() {
      x := make(chan int, 1)
      <-x
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("mutex lock", async () => {
    const program = `
    package main
  
    func main() {
      var mu Mutex
      Lock(mu)
      Lock(mu)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("waitgroup", async () => {
    const program = `
    package main
  
    func main() {
      var wg WaitGroup
      Add(wg, 1)
      Wait(wg)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });
});

describe("deadlock detection with multiple threads", () => {
  test("unbuffered channel send", async () => {
    const program = `
    package main

    var wg WaitGroup

    func deadlock() {
      x := make(chan int)
      x <- 5
      Done(wg)
    }
  
    func main() {
      i := 0
      for i < 10 {
        go deadlock()
        Add(wg, 1)
        i++
      }
      Wait(wg)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("unbuffered channel receive", async () => {
    const program = `
    package main

    var wg WaitGroup

    func deadlock() {
      x := make(chan int)
      <-x
      Done(wg)
    }
  
    func main() {
      i := 0
      for i < 10 {
        go deadlock()
        Add(wg, 1)
        i++
      }
      Wait(wg)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("buffered channel send", async () => {
    const program = `
    package main

    var wg WaitGroup

    func deadlock() {
      x := make(chan int, 1)
      x <- 5
      x <- 6
      Done(wg)
    }
  
    func main() {
      i := 0
      for i < 10 {
        go deadlock()
        Add(wg, 1)
        i++
      }
      Wait(wg)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("buffered channel receive", async () => {
    const program = `
    package main

    var wg WaitGroup

    func deadlock() {
      x := make(chan int, 1)
      <-x
      Done(wg)
    }
  
    func main() {
      i := 0
      for i < 10 {
        go deadlock()
        Add(wg, 1)
        i++
      }
      Wait(wg)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("mutex lock", async () => {
    const program = `
    package main

    var wg WaitGroup

    func deadlock() {
      var mu Mutex
      Lock(mu)
      Lock(mu)
      Done(wg)
    }
  
    func main() {
      i := 0
      for i < 10 {
        go deadlock()
        Add(wg, 1)
        i++
      }
      Wait(wg)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("waitgroup", async () => {
    const program = `
    package main

    var wg WaitGroup

    func deadlock() {
      var wg2 WaitGroup
      Add(wg2, 1)
      Wait(wg2)
      Done(wg)
    }
  
    func main() {
      i := 0
      for i < 10 {
        go deadlock()
        Add(wg, 1)
        i++
      }
      Wait(wg)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test.skip("many threads", async () => {
    const program = `
    package main

    var wg WaitGroup

    func deadlock() {
      x := make(chan int)
      x <- 5
      Done(wg)
    }
  
    func main() {
      i := 0
      for i < 80000 {
        go deadlock()
        Add(wg, 1)
        i++
      }
      Wait(wg)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });
});

describe("deadlock detection with multiple interacting threads", () => {
  test("double mutex", async () => {
    const program = `
    package main

    var (
      m1 Mutex
      m2 Mutex
      wg WaitGroup
    )

    func foo() {
      Lock(m1)
      Sleep(10) // let the other thread lock m2
      Lock(m2)
      Unlock(m1)
      Unlock(m2)
      Done(wg)
    }

    func bar() {
      Lock(m2)
      Sleep(10) // let the other thread lock m1
      Lock(m1)
      Unlock(m2)
      Unlock(m1)
      Done(wg)
    }

    func main() {
      Add(wg, 2)
      go foo()
      go bar()
      Wait(wg)
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("double channel", async () => {
    const program = `
    package main

    var wg WaitGroup
    
    func foo(x chan int, y chan int) {
      <-x
      y <- 5
      Done(wg)
    }

    func bar(x chan int, y chan int) {
      <-y
      x <- 6
      Done(wg)
    }

    func main() {
      x := make(chan int)
      y := make(chan int)
      Add(wg, 2)
      go foo(x, y)
      go bar(x, y)
      Wait(wg)
    }
    `;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });

  test("double waitgroup", async () => {
    const program = `
    package main

    var (
      wg WaitGroup
      wg1 WaitGroup
      wg2 WaitGroup
    )

    func foo() {
      Wait(wg2)
      Done(wg1)
      Done(wg)
    }

    func bar() {
      Wait(wg1)
      Done(wg2)
      Done(wg)
    }

    func main() {
      Add(wg, 2)
      Add(wg1, 1)
      Add(wg2, 1)
      go foo()
      go bar()
      Wait(wg)
    }
    `;
    await expect(golangRunner.execute(program)).rejects.toThrow(RuntimeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(expected_error);
  });
});
