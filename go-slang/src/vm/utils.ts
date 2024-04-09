import { RuntimeError } from "../errors";
import { Token } from "../types/ast";

const binop_microcode: any = {
  "+": (x: any, y: any) => x + y,
  "-": (x: number, y: number) => x - y,
  "*": (x: number, y: number) => x * y,
  "/": (x: number, y: number) => {
    if (y === 0) throw new RuntimeError("invalid operation: division by zero");
    return x / y;
  },
  "%": (x: number, y: number) => x % y,
  "<": (x: number, y: number) => x < y,
  "<=": (x: number, y: number) => x <= y,
  ">=": (x: number, y: number) => x >= y,
  ">": (x: number, y: number) => x > y,
  "==": (x: number, y: number) => x === y,
  "!=": (x: number, y: number) => x !== y,
};

export const apply_binop = (op: Token, v2: any, v1: any) =>
  binop_microcode[op](v1, v2);

const unop_microcode: any = {
  "-": (x: number) => -x,
  "!": (x: boolean) => !x,
};

export const apply_unop = (op: Token, v: any) => unop_microcode[op](v);
