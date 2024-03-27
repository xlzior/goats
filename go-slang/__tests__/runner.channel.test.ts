import { GolangRunner } from "../src";
import { strip_quotes } from "../src/utils";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: { arity: 1, apply: println } });
});

type Value = string | boolean | number;

describe("unbuffered channels", () => {
  const messages = [
    ["string", '"Hello, World!"'],
    ["boolean", true],
    ["integer", 42],
  ] as [string, Value][];

  test.each(messages)("make(chan %s)", async (type, message) => {
    const program = `
      package main

      func send(messages chan ${type}) {
        Sleep(2)
        messages <- ${message}
      }

      func main() {
        messages := make(chan ${type})
        go send(messages)
        msg := <-messages
        return msg
      }`;
    const { value } = await golangRunner.execute(program);
    expect(value).toEqual(strip_quotes(message));
  });

  test.each(messages)("make(chan %s, 0)", async (type, message) => {
    const program = `
      package main

      func send(messages chan ${type}) {
        Sleep(2)
        messages <- ${message}
      }

      func main() {
        messages := make(chan ${type}, 0)
        go send(messages)
        msg := <-messages
        return msg
      }`;
    const { value } = await golangRunner.execute(program);
    expect(value).toEqual(strip_quotes(message));
  });

  test("sender should block if receiver is not ready", async () => {
    const program = `
    package main

    func send(messages chan int) {
      Println("sender running")
      messages <- 9001
      Println("sent") // should never reach here
    }

    func main() {
      messages := make(chan int)
      go send(messages)
      Sleep(2) // let sender run and block
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(1);
    expect(println).toHaveBeenCalledWith("sender running");
  });

  test("sender should be unblocked if receiver is ready", async () => {
    const program = `
    package main

    func send(messages chan int) {
      Println("sender running")
      messages <- 9001
      Println("sent")
    }

    func main() {
      messages := make(chan int)
      go send(messages)
      Sleep(2) // let sender run and block
      Println("going to unblock")
      msg := <-messages // unblock the sender
      Sleep(2) // let sender finish
      return msg
    }`;
    const { value } = await golangRunner.execute(program);
    expect(value).toEqual(9001);
    expect(println).toHaveBeenCalledTimes(3);
    expect(println).toHaveBeenNthCalledWith(1, "sender running");
    expect(println).toHaveBeenNthCalledWith(2, "going to unblock"); // should print before "sent"
    expect(println).toHaveBeenCalledWith("sent");
  });

  test("receiver should block if sender is not ready", async () => {
    const program = `
    package main

    func receive(messages chan int) {
      Println("receiver running")
      msg := <-messages
      Println("received") // should never reach here
    }

    func main() {
      messages := make(chan int)
      go receive(messages)
      Sleep(2) // let receiver run and block
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(1);
    expect(println).toHaveBeenCalledWith("receiver running");
  });

  test("receiver should be unblocked if sender is ready", async () => {
    const program = `
    package main

    func receive(messages chan int) {
      Println("receiver running")
      msg := <-messages
      Println(msg)
    }

    func main() {
      messages := make(chan int)
      go receive(messages)
      Sleep(2) // let receiver run and block
      Println("going to unblock")
      messages <- 42 // unblock the receiver
      Println("sent")
      Sleep(2) // let receiver finish
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(4);
    expect(println).toHaveBeenNthCalledWith(1, "receiver running");
    expect(println).toHaveBeenNthCalledWith(2, "going to unblock"); // should print before 42
    expect(println).toHaveBeenCalledWith(42);
    expect(println).toHaveBeenCalledWith("sent");
  });

  test("multiple messages in the channel", async () => {
    const program = `
    package main

    func send(messages chan int) {
      messages <- 1
      Println("1 sent")
      messages <- 2
      Println("2 sent")
      messages <- 3
      Println("3 sent")
    }

    func main() {
      messages := make(chan int)
      go send(messages)
      msg1 := <-messages
      Println("1 received")
      msg2 := <-messages
      Println("2 received")
      msg3 := <-messages
      Println("3 received")
      return msg1 * 100 + msg2 * 10 + msg3
    }`;
    const { value } = await golangRunner.execute(program);
    expect(value).toEqual(123);
    expect(println).toHaveBeenCalledTimes(6);
    const expected_numbers = [1, 1, 2, 2, 3, 3];
    // between sender and receiver, order is not guaranteed
    println.mock.calls.forEach((call, i) => {
      expect(call[0]).toMatch(
        new RegExp(`${expected_numbers[i]} (sent|received)`),
      );
    });
  });

  test("multiple senders waiting", async () => {
    const program = `
    package main

    func send(messages chan int, x int) {
      messages <- x
    }

    func main() {
      messages := make(chan int)
      go send(messages, 1)
      go send(messages, 2)
      go send(messages, 3)
      msg1 := <-messages
      msg2 := <-messages
      msg3 := <-messages
      Sleep(2)
      Println(msg1)
      Println(msg2)
      Println(msg3)
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(3);
    expect(println).toHaveBeenCalledWith(1);
    expect(println).toHaveBeenCalledWith(2);
    expect(println).toHaveBeenCalledWith(3);
  });

  test("multiple receivers waiting", async () => {
    const program = `
    package main

    func receive(messages chan int) {
      msg := <-messages
      Println(msg)
    }

    func main() {
      messages := make(chan int)
      go receive(messages)
      go receive(messages)
      go receive(messages)
      messages <- 1
      messages <- 2
      messages <- 3
      Sleep(2)
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(3);
    expect(println).toHaveBeenCalledWith(1);
    expect(println).toHaveBeenCalledWith(2);
    expect(println).toHaveBeenCalledWith(3);
  });
});

describe("buffered channels", () => {
  const messages = [
    ["string", '"a"', '"b"', '"c"'],
    ["boolean", true, false, true],
    ["integer", 1, 2, 3],
  ] as [string, Value, Value, Value][];

  test.each(messages)(
    "make(chan %s, 3)",
    async (type, first, second, third) => {
      const program = `
      package main

      func main() {
        messages := make(chan ${type}, 3)
        messages <- ${first}
        messages <- ${second}
        messages <- ${third}

        first := <-messages
        second := <-messages
        third := <-messages

        Println(first)
        Println(second)
        Println(third)
      }`;
      const { value } = await golangRunner.execute(program);
      const expected = undefined;
      expect(value).toEqual(expected);

      expect(println).toHaveBeenNthCalledWith(1, strip_quotes(first));
      expect(println).toHaveBeenNthCalledWith(2, strip_quotes(second));
      expect(println).toHaveBeenNthCalledWith(3, strip_quotes(third));
    },
  );

  test("multiple interleaving send and receive", async () => {
    const program = `
    package main

    func main() {
      messages := make(chan int, 3)
      messages <- 1
      first := <-messages

      messages <- 2
      second := <-messages

      messages <- 3
      third := <-messages

      Println(first)
      Println(second)
      Println(third)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = undefined;
    expect(value).toEqual(expected);

    expect(println).toHaveBeenNthCalledWith(1, 1);
    expect(println).toHaveBeenNthCalledWith(2, 2);
    expect(println).toHaveBeenNthCalledWith(3, 3);
  });

  test("sender should block if buffer is full (capacity 1)", async () => {
    const program = `
    package main

    func send(messages chan int) {
      Println("sender running")
      messages <- 9001
      Println("sent")
    }

    func main() {
      messages := make(chan int, 1)
      messages <- 42
      go send(messages)
      Sleep(2) // let sender run and block
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(1);
    expect(println).toHaveBeenCalledWith("sender running");
  });

  test("sender should block if buffer is full (capacity > 1)", async () => {
    const program = `
    package main

    func send(messages chan int) {
      Println("sender running")
      messages <- 9001
      Println("sent")
    }

    func main() {
      messages := make(chan int, 3)
      messages <- 42
      messages <- 42
      messages <- 42
      go send(messages)
      Sleep(2) // let sender run and block
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(1);
    expect(println).toHaveBeenCalledWith("sender running");
  });

  test("sender should be unblocked if buffer has space", async () => {
    const program = `
    package main

    func send(messages chan int) {
      Println("sender running")
      messages <- 9001
      Println("sent")
    }

    func main() {
      messages := make(chan int, 1)
      messages <- 42
      go send(messages)
      Sleep(2) // let sender run and block
      Println("going to unblock")
      msg := <-messages // unblock the sender
      Println("received")
      Sleep(2) // let sender finish
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(4);
    expect(println).toHaveBeenNthCalledWith(1, "sender running");
    expect(println).toHaveBeenNthCalledWith(2, "going to unblock"); // should print before "sent"
    expect(println).toHaveBeenCalledWith("received");
    expect(println).toHaveBeenCalledWith("sent");
  });

  test("receiver should block if buffer is empty", async () => {
    const program = `
    package main

    func receive(messages chan int) {
      Println("receiver running")
      msg := <-messages
      Println("received")
    }

    func main() {
      messages := make(chan int, 1)
      go receive(messages)
      Sleep(2) // let receiver run and block
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(1);
    expect(println).toHaveBeenCalledWith("receiver running");
  });

  test("receiver should be unblocked if buffer has message", async () => {
    const program = `
    package main

    func receive(messages chan int) {
      Println("receiver running")
      msg := <-messages
      Println("received")
    }

    func main() {
      messages := make(chan int, 1)
      go receive(messages)
      Sleep(2) // let receiver run and block
      Println("going to unblock")
      messages <- 42 // unblock the receiver
      Println("sent")
      Sleep(2) // let receiver finish
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(4);
    expect(println).toHaveBeenNthCalledWith(1, "receiver running");
    expect(println).toHaveBeenNthCalledWith(2, "going to unblock"); // should print before "sent"
    expect(println).toHaveBeenCalledWith("sent");
    expect(println).toHaveBeenCalledWith("received");
  });

  test("multiple senders waiting", async () => {
    const program = `
    package main

    func send(messages chan int, x int) {
      messages <- x
    }

    func main() {
      messages := make(chan int, 1)
      go send(messages, 1)
      go send(messages, 2)
      go send(messages, 3)
      msg1 := <-messages
      msg2 := <-messages
      msg3 := <-messages
      Sleep(2)
      Println(msg1)
      Println(msg2)
      Println(msg3)
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(3);
    expect(println).toHaveBeenCalledWith(1);
    expect(println).toHaveBeenCalledWith(2);
    expect(println).toHaveBeenCalledWith(3);
  });

  test("multiple receivers waiting", async () => {
    const program = `
    package main

    func receive(messages chan int) {
      msg := <-messages
      Println(msg)
    }

    func main() {
      messages := make(chan int, 1)
      go receive(messages)
      go receive(messages)
      go receive(messages)
      messages <- 1
      messages <- 2
      messages <- 3
      Sleep(2)
    }`;
    await golangRunner.execute(program);
    expect(println).toHaveBeenCalledTimes(3);
    expect(println).toHaveBeenCalledWith(1);
    expect(println).toHaveBeenCalledWith(2);
    expect(println).toHaveBeenCalledWith(3);
  });
});

describe("channels", () => {
  test("empty channel", async () => {
    const program = `
    package main

    func main() {
      buffered := make(chan int, 3)
      unbuffered := make(chan int, 0)
      unbuffered_2 := make(chan int)
      return 0
    }`;
    const { value } = await golangRunner.execute(program);
    expect(value).toEqual(0);
  });
});
