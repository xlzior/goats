import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: { arity: 1, apply: println } });
});

describe("Golang runner for evaluating unbuffered channels", () => {
  test("evaluate program with simple unbuffered channel", async () => {
    const program = `
    package main

    func send(messages chan int) {
      Sleep(20)
      messages <- 90001
    }

    func main() {
      messages := make(chan int)
      go send(messages)
      msg := <-messages
      Println(msg)
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = undefined;
    expect(value).toEqual(expected);

    expect(println).toHaveBeenNthCalledWith(1, 90001);
  });
});

describe("Golang runner for evaluating buffered channels", () => {
  test("evaluate program with simple buffered channel", async () => {
    const program = `
    package main

    func main() {
      messages := make(chan int, 3)
      messages <- 1
      messages <- 2
      messages <- 3

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

    expect(println).toHaveBeenNthCalledWith(1, 1);
    expect(println).toHaveBeenNthCalledWith(2, 2);
    expect(println).toHaveBeenNthCalledWith(3, 3);
  });
});
