import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("Golang runner for evaluating while loop statements", () => {
  test("evaluate while loop with loop condition not satisfied", async () => {
    const program = `
    package main
  
    func main() {
      x := 1
      for x < 0 {
        x = x + 1
      }
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 1;
    expect(value).toEqual(expected);
  });

  test("evaluate while loop with loop condition satisfied", async () => {
    const program = `
    package main
  
    func main() {
      x := 1
      for x < 10 {
        x = x + 1
      }
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 10;
    expect(value).toEqual(expected);
  });

  test("evaluate while loop with more iterations", async () => {
    const program = `
    package main
  
    func main() {
      x := 1
      for x < 100000 {
        x += 1
      }
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = 100000;
    expect(value).toEqual(expected);
  });

  test("evaluate while loop with 1 level of nesting", async () => {
    const program = `
      package main
      
      func main() {
        sum := 0
        x := 0
        for x < 5 {
          y := 0
          for y < 3 {
            sum += x + y
            y += 1
          }
          x += 1
        }
        return sum
      }`;
    const { value } = await golangRunner.execute(program);
    const expected = 45;
    expect(value).toEqual(expected);
  });

  test("evaluate while loop with 2 levels of nesting", async () => {
    const program = `
      package main
      
      func main() {
        sum := 0
        x := 0
        for x < 3 {
          y := 0
          for y < 2 {
            z := 0
            for z < 4 {
              sum += x + y + z
              z += 1
            }
            y += 1
          }
          x += 1
        }
        return sum
      }`;
    const { value } = await golangRunner.execute(program);
    const expected = 72;
    expect(value).toEqual(expected);
  });

  test("evaluate while loop with 3 levels of nesting", async () => {
    const program = `
      package main
      
      func main() {
        sum := 0
        w := 0
        for w < 2 {
          x := 0
          for x < 2 {
            y := 0
            for y < 2 {
              z := 0
              for z < 2 {
                sum += w + x + y + z
                z += 1
              }
              y += 1
            }
            x += 1
          }
          w += 1
        }
        return sum
      }`;
    const { value } = await golangRunner.execute(program);
    const expected = 32;
    expect(value).toEqual(expected);
  });

  test("evaluate while loop one after another", async () => {
    const program = `
      package main
      
      func main() {
        sum := 0
        x := 0
        for x < 5 {
          sum += x
          x += 1
        }
        y := 0
        for y < 5 {
          sum += y
          y += 1
        }
        return sum
      }`;
    const { value } = await golangRunner.execute(program);
    const expected = 20;
    expect(value).toEqual(expected);
  });

  test("evaluate while loop with if statement affecting sum", async () => {
    const program = `
      package main
      
      func main() {
        sum := 0
        x := 0
        for x < 5 {
          if x % 2 == 0 {
            sum += x 
          }
          x += 1
        }
        return sum
      }`;
    const { value } = await golangRunner.execute(program);
    const expected = 6;
    expect(value).toEqual(expected);
  });

  test("evaluate while loop with nested if statements", async () => {
    const program = `
      package main
      
      func main() {
        sum := 0
        x := 0
        for x < 3 {
          y := 0
          for y < 3 {
            if x == y {
              sum += x + y
            }
            y += 1
          }
          x += 1
        }
        return sum
      }`;
    const { value } = await golangRunner.execute(program);
    const expected = 6;
    expect(value).toEqual(expected);
  });
});
