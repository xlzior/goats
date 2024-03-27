import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("conditional statements", () => {
  test("simple conditional statement with only if condition", async () => {
    const program = `
    package main
  
    func main() {
      x := 2
      if (x < 5) {
        return 100
      } 
      return -1
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 100;
    expect(value).toEqual(expected);
  });

  test("simple conditional statement for if case", async () => {
    const program = `
    package main
  
    func main() {
      x := 3
      if (x < 5) {
        return 100
      } else {
        return 200
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 100;
    expect(value).toEqual(expected);
  });

  test("simple conditional statement for else case", async () => {
    const program = `
    package main
  
    func main() {
      x := 10
      if (x < 5) {
        return 100
      } else {
        return 200
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 200;
    expect(value).toEqual(expected);
  });

  test("conditional statement with else if", async () => {
    const program = `
    package main
  
    func main() {
      x := 7
      if (x < 5) {
        return 100
      } else if (x == 5) {
        return 200
      } else {
        return 300
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 300;
    expect(value).toEqual(expected);
  });

  test("conditional statement with multiple else if conditions", async () => {
    const program = `
    package main
  
    func main() {
      x := 5
      if (x < 5) {
        return 100
      } else if (x == 5) {
        return 200
      } else if (x == 6) {
        return 300
      } else if (x == 7) {
        return 400
      } else {
        return 500
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 200;
    expect(value).toEqual(expected);
  });

  test("conditional statement with nested if-else", async () => {
    const program = `
    package main
  
    func main() {
      x := 7
      if (x < 5) {
        return 100
      } else {
        if (x == 5) {
          return 200
        } else if (x == 6) {
          return 300
        } else {
          return 400
        }
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 400;
    expect(value).toEqual(expected);
  });

  test("conditional statement with deeply nested if-else", async () => {
    const program = `
    package main
  
    func main() {
      x := 7
      if (x < 5) {
        return 100
      } else {
        if (x == 5) {
          return 200
        } else {
          if (x == 6) {
            return 300
          } else {
            return 400
          }
        }
      }
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 400;
    expect(value).toEqual(expected);
  });
});
