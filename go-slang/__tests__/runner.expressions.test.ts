import { GolangRunner } from "../src";

let golangRunner: GolangRunner;

beforeEach(() => {
  golangRunner = new GolangRunner();
});

describe("Golang runner for evaluating binary expressions", () => {
  const singleLinebinaryExprTestCases = [
    {
      program: `
      package main
      
      func main() {
        return 1 + 2
      }`,
      expected: 3,
    },
    {
      program: `
      package main
      
      func main() {
        return 10 * 2 / 5
      }`,
      expected: 4.0,
    },
    // Add more test cases here
  ];

  test.each(singleLinebinaryExprTestCases)(
    "evaluate program with a single line of binary expr: %s",
    async ({ program, expected }) => {
      const actual = await golangRunner.execute(program);
      expect(actual.value).toEqual(expected);
    }
  );

  test("evaluate program with multiple lines of binary expr should return the result of the last evaluated expr", async () => {
    const program = `
    package main
    
    func main() {
      10 * 2 / 5
      33 - 13
      return 10 * 7 - 5
    }`;
    const actual = await golangRunner.execute(program);
    const expected = 65;
    expect(actual.value).toEqual(expected);
  });
});


describe("Golang runner for evaluating logical expressions", () => {

  test("evaluate program with logical OR expression that evaluates to true", async () => {
    const program = `
    package main
  
    func main() {
      x := 1 < 2 || 5 > 10
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = true; 
    expect(actual.value).toEqual(expected);
  });

  test("evaluate program with logical OR expression that evaluates to false", async () => {
    const program = `
    package main
  
    func main() {
      x := 1 > 2 || 5 > 10
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = false; 
    expect(actual.value).toEqual(expected);
  });

  test("evaluate program with logical AND expression that evaluates to true", async () => {
    const program = `
    package main
  
    func main() {
      x := 1 < 2 && 5 > 2
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = true; 
    expect(actual.value).toEqual(expected);
  });

  test("evaluate program with logical AND expression that evaluates to false", async () => {
    const program = `
    package main
  
    func main() {
      x := 1 < 2 && 5 > 10
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = false; 
    expect(actual.value).toEqual(expected);
  });

  test("evaluate program with logical expression involving both AND and OR", async () => {
    const program = `
    package main
  
    func main() {
      x := (1 <= 2 && 5 > 2) || (3 >= 6 && 4 <= 10)
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = true;
    expect(actual.value).toEqual(expected);
  });
  
  test("evaluate program with complex nested expression", async () => {
    const program = `
    package main
  
    func main() {
      x := ((1 < 2 && (5 > 2 || (3 > 6 && 4 < 10))) || (2 > 3 && (7 < 5 || (6 < 9 && 8 > 2))))
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = true; 
    expect(actual.value).toEqual(expected);
  });

  test("evaluate program with multiple levels of nesting", async () => {
    const program = `
    package main
  
    func main() {
      x := ((1 < 2 && (5 > 2 || (3 < 6 && (4 < 10 || (7 < 9 && 8 > 2))))) || (2 > 3 && (7 < 5 || (6 < 9 && (8 > 2 || (1 < 5 && 2 < 9))))))
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = true;
    expect(actual.value).toEqual(expected);
  });

  test("evaluate program with complex arithmetic conditions", async () => {
    const program = `
    package main
  
    func main() {
      a := 5
      b := 7
      x := (a * b > 30 && (a + b < 15 || (a - b > 0 && (a / b < 1 || (b % a == 0 && a % 2 == 0)))))
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = true; 
    expect(actual.value).toEqual(expected);
  });

  test("evaluate program with mixed type conditions", async () => {
    const program = `
    package main
  
    func main() {
      x := (3 < 5 && "hello" != "world" || (true && false))
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = true;
    expect(actual.value).toEqual(expected);
  });
  
  test("evaluate program with complex boolean expressions", async () => {
    const program = `
    package main
  
    func main() {
      x := ((true && (false || true)) || (false && (true || false)))
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = true; 
    expect(actual.value).toEqual(expected);
  });

});