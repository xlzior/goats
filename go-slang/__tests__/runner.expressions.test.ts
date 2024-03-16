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

  test("evaluate program with short circuit for OR", async () => {
    const program = `
    package main
  
    func main() {
      x := true || 1 + true;
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = true;
    expect(actual.value).toEqual(expected);
  });

  test("evaluate program with short circuit for AND", async () => {
    const program = `
    package main
  
    func main() {
      x := false && 1 + true;
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = false;
    expect(actual.value).toEqual(expected);
  });

});


describe("Golang runner for evaluating string expressions", () => {

  test("evaluate program with empty string should return empty string", async () => {
    const program = `
    package main
  
    func main() {
      x := ""
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "";
    expect(value).toEqual(expected);
  });

  test("evaluate program with concatenating 2 empty string should return empty string", async () => {
    const program = `
    package main
  
    func main() {
      x := "" + ""
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "";
    expect(value).toEqual(expected);
  });

  test("evaluate program with string should return string value", async () => {
    const program = `
    package main
  
    func main() {
      x := "hello world"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "hello world";
    expect(value).toEqual(expected);
  });

  test("evaluate program with string of numbers", async () => {
    const program = `
    package main
  
    func main() {
      x := "123"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "123";
    expect(value).toEqual(expected);
  });

  test("evaluate program with string of numbers with concatenation should return concatenated string value", async () => {
    const program = `
    package main
  
    func main() {
      x := "123"
      y := "456"
      z := x + y
      return z
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "123456";
    expect(value).toEqual(expected);
  });

  test("evaluate program with string of true is treated as a literal string, not boolean", async () => {
    const program = `
    package main
  
    func main() {
      x := "true"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "true";
    expect(value).toEqual(expected);
  });

  test("evaluate program with string of false is treated as a literal string, not boolean", async () => {
    const program = `
    package main
  
    func main() {
      x := "false"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "false";
    expect(value).toEqual(expected);
  });


  test("evaluate program with string concatenation using + operator once", async () => {
    const program = `
    package main
  
    func main() {
      x := "hello " + "world"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "hello world";
    expect(value).toEqual(expected);
  });

  test("evaluate program with string concatenation using + operator multiple times", async () => {
    const program = `
    package main
  
    func main() {
      x := "i " + "love " + "orange juice " + "for breakfast"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "i love orange juice for breakfast";
    expect(value).toEqual(expected);
  });

  test("evaluate program with string concatenation using += operator once", async () => {
    const program = `
    package main
  
    func main() {
      x := "hello "
      x += "world"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "hello world";
    expect(value).toEqual(expected);
  });

  test("evaluate program with string concatenation using += operator multiple times", async () => {
    const program = `
    package main
  
    func main() {
      x := "i "
      x += "love "
      x += "orange juice "
      x += "for breakfast"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "i love orange juice for breakfast";
    expect(value).toEqual(expected);
  });

  test("evaluate program with string equality, true case", async () => {
    const program = `
    package main
  
    func main() {
      x := "hello" == "hello"
      return x
    }`;
    const { value }= await golangRunner.execute(program);
    const expected = true;
    expect(value).toEqual(expected);
  });

  test("evaluate program with string equality, false case", async () => {
    const program = `
    package main
  
    func main() {
      x := "hello" == "hellow"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = false;
    expect(value).toEqual(expected);
  });

  test("evaluate program with string assignment passed as reference", async () => {
    const program = `
    package main
  
    func main() {
      x := "hello world"
      y := x
      return y
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "hello world";
    expect(value).toEqual(expected);
  });

  test("evaluate program with string assignment passed as reference with concatenation", async () => {
    const program = `
    package main
  
    func main() {
      x := "hello "
      y := x + "world"
      return y
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = "hello world";
    expect(value).toEqual(expected);
  });

})