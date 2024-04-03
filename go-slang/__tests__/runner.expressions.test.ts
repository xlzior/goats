import { GolangRunner } from "../src";
import { TypeError } from "../src/errors";
import { Token } from "../src/types/ast";

let golangRunner: GolangRunner;

const println = jest.fn();
beforeEach(() => {
  println.mockClear();
  golangRunner = new GolangRunner({ Println: { arity: 1, apply: println } });
});

describe("binary expressions", () => {
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
    "a single line of binary expr: %s",
    async ({ program, expected }) => {
      const actual = await golangRunner.execute(program);
      expect(actual.value).toEqual(expected);
    },
  );

  test("multiple lines of binary expr should return the result of the last evaluated expr", async () => {
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

describe("logical expressions", () => {
  test("logical OR expression that evaluates to true", async () => {
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

  test("logical OR expression that evaluates to false", async () => {
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

  test("logical AND expression that evaluates to true", async () => {
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

  test("logical AND expression that evaluates to false", async () => {
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

  test("logical expression involving both AND and OR", async () => {
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

  test("complex nested expression", async () => {
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

  test("multiple levels of nesting", async () => {
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

  test("complex arithmetic conditions", async () => {
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

  test("mixed type conditions", async () => {
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

  test("complex boolean expressions", async () => {
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

  test("short circuit for OR", async () => {
    const program = `
    package main

    func boo() bool {
      Println("DONT PRINT")
      return false
    }
  
    func main() {
      x := true || boo()
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = true;
    expect(actual.value).toEqual(expected);
    expect(println).not.toHaveBeenCalledWith("DONT PRINT");
  });

  test("short circuit for AND", async () => {
    const program = `
    package main

    func boo() bool {
      Println("DONT PRINT")
      return false
    }
  
    func main() {
      x := false && boo();
      return x
    }`;
    const actual = await golangRunner.execute(program);
    const expected = false;
    expect(actual.value).toEqual(expected);
    expect(println).not.toHaveBeenCalledWith("DONT PRINT");
  });
});

describe("string expressions", () => {
  test("empty string should return empty string", async () => {
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

  test("concatenating 2 empty string should return empty string", async () => {
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

  test("string should return string value", async () => {
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

  test("string of numbers", async () => {
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

  test("string of numbers with concatenation should return concatenated string value", async () => {
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

  test("string of true is treated as a literal string, not boolean", async () => {
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

  test("string of false is treated as a literal string, not boolean", async () => {
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

  test("string concatenation using + operator once", async () => {
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

  test("string concatenation using + operator multiple times", async () => {
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

  test("string concatenation using += operator once", async () => {
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

  test("string concatenation using += operator multiple times", async () => {
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

  test("string equality, true case", async () => {
    const program = `
    package main
  
    func main() {
      x := "hello" == "hello"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = true;
    expect(value).toEqual(expected);
  });

  test("string equality, true case with constructed string", async () => {
    const program = `
    package main
  
    func main() {
      x := "hello world" == "hello " + "world"
      return x
    }`;
    const { value } = await golangRunner.execute(program);
    const expected = true;
    expect(value).toEqual(expected);
  });

  test("string equality, false case", async () => {
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

  test("string assignment passed as reference", async () => {
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

  test("string assignment passed as reference with concatenation", async () => {
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
});

// ========================
// NEGATIVE TYPING TESTS
// ========================

const binaryExprInputsForAdd: [
  number | string | boolean,
  number | string | boolean,
  string,
][] = [
  [1, '"hello"', "[int, string]"],
  [1, false, "[int, bool]"],
  ['"hello"', true, "[string, bool]"],
  [true, false, "[bool, bool]"],
];

describe(`incorrect types of binary expr with operator: ${Token.ADD}`, () => {
  test.each(binaryExprInputsForAdd)(
    `Incorrect type: %p %p`,
    async (operand1, operand2, actual_type) => {
      const program = `
      package main

      func main() {
          ${operand1} ${Token.ADD} ${operand2};
      }`;
      await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
      await expect(golangRunner.execute(program)).rejects.toThrow(
        `${Token.ADD} expects [int, int] or [string, string], but got ${actual_type}`,
      );
    },
  );
});

// Expect both operands to be integers
const binaryOps = [Token.SUB, Token.MUL, Token.QUO, Token.REM];

const binaryExprInputs: [
  number | string | boolean, // operand 1
  number | string | boolean, // operand 2
  string, // actual type
][] = [
  [1, '"hello"', "[int, string]"],
  [1, false, "[int, bool]"],
  ['"hello"', '"world"', "[string, string]"],
  ['"hello"', true, "[string, bool"],
  [true, false, "[bool, bool]"],
];

binaryOps.forEach((operator) => {
  describe(`incorrect types of binary expr with operator: ${operator}`, () => {
    test.each(binaryExprInputs)(
      `Incorrect type: %p %p`,
      async (operand1, operand2, actual_type) => {
        const program = `
        package main

        func main() {
            ${operand1} ${operator} ${operand2};
        }`;

        await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
        await expect(golangRunner.execute(program)).rejects.toThrow(
          `${operator} expects [int, int], but got ${actual_type}`,
        );
      },
    );
  });
});

// Expect both operands to be booleans
const logicalOps = [Token.LAND, Token.LOR];

const logicalExprInputs: [
  number | string | boolean,
  number | string | boolean,
  string,
][] = [
  [1, 2, "[int, int]"],
  [1, '"hello"', "[int, string]"],
  [1, false, "[int, bool]"],
  ['"hello"', '"world"', "[string, string]"],
  ['"hello"', true, "[string, bool]"],
];

logicalOps.forEach((operator) => {
  describe(`incorrect types of logical expr with operator: ${operator}`, () => {
    test.each(logicalExprInputs)(
      `Incorrect type: %p %p`,
      async (operand1, operand2, actual_type) => {
        const program = `
        package main

        func main() {
            ${operand1} ${operator} ${operand2};
        }`;
        await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
        await expect(golangRunner.execute(program)).rejects.toThrow(
          `${operator} expects [bool, bool], but got ${actual_type}`,
        );
      },
    );
  });
});

// Expect both operands to be of the same type, except bool
// E.g. int and int, string and string
const comparisonOps = [Token.LSS, Token.LEQ, Token.GTR, Token.GEQ];

const comparisonExprInputs: [
  number | string | boolean,
  number | string | boolean,
  string,
][] = [
  [1, '"hello"', "[int, string]"],
  [1, false, "[int, bool]"],
  ['"hello"', true, "[string, bool]"],
  [true, false, "[bool, bool"],
];

comparisonOps.forEach((operator) => {
  describe(`incorrect types of comparison expr with operator: ${operator}`, () => {
    test.each(comparisonExprInputs)(
      `Incorrect type: %p %p`,
      async (operand1, operand2, actual_type) => {
        const program = `
        package main

        func main() {
            ${operand1} ${operator} ${operand2};
        }`;

        await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
        await expect(golangRunner.execute(program)).rejects.toThrow(
          `${operator} expects [int, int] or [string, string], but got ${actual_type}`,
        );
      },
    );
  });
});

// Expect both operands to be of the same type
// E.g. int and int, string and string, bool and bool
const equalityOps = [Token.EQL, Token.NEQ];

const equalityExprInputs: [
  number | string | boolean,
  number | string | boolean,
  string,
][] = [
  [1, '"hello"', "[int, string]"],
  [1, false, "[int, bool]"],
  ['"hello"', true, "[string, bool]"],
];

equalityOps.forEach((operator) => {
  describe(`incorrect types of equality expr with operator: ${operator}`, () => {
    test.each(equalityExprInputs)(
      `Incorrect type: %p %p`,
      async (operand1, operand2, actual_type) => {
        const program = `
        package main

        func main() {
            ${operand1} ${operator} ${operand2};
        }`;
        await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
        await expect(golangRunner.execute(program)).rejects.toThrow(
          `${operator} expects [int, int] or [string, string], but got ${actual_type}`,
        );
      },
    );
  });
});

describe("incorrect types of unary minus operator", () => {
  test("Incorrect type: string", async () => {
    const program = `
    package main

    func main() {
      -"hello"
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      `${Token.SUB}unary expects [int], but got [string]`,
    );
  });

  test("Incorrect type: bool", async () => {
    const program = `
    package main

    func main() {
      -true
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      `${Token.SUB}unary expects [int], but got [bool]`,
    );
  });
});

describe("incorrect types of unary not operator", () => {
  test("Incorrect type: string", async () => {
    const program = `
    package main
  
    func main() {
      !"hello"
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      `${Token.NOT} expects [bool], but got [string]`,
    );
  });

  test("Incorrect type: int", async () => {
    const program = `
    package main
  
    func main() {
      !5
    }`;
    await expect(golangRunner.execute(program)).rejects.toThrow(TypeError);
    await expect(golangRunner.execute(program)).rejects.toThrow(
      `${Token.NOT} expects [bool], but got [int]`,
    );
  });
});
