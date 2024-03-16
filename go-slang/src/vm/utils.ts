import { is_number, is_string, is_boolean } from "../utils";
import { Token } from "../types/ast";

const binop_microcode: any = {
  "+": (x: any, y: any) => {
    if (!(is_number(x) && is_number(y)) && !(is_string(x) && is_string(y)))
      throw new Error(`Expects two numbers or strings, got: ${x}, ${y}`);
    return x + y;
  },
  "-": (x: number, y: number) => x - y,
  "*": (x: number, y: number) => x * y,
  "/": (x: number, y: number) => x / y,
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
  "-": (x: number) => {
    if (!is_number(x)) throw new Error(`- expects a number, got: ${x}`);
    return -x;
  },
  "!": (x: boolean) => {
    if (!is_boolean(x)) throw new Error(`! expects a boolean, got: ${x}`);
    return !x;
  },
};

export const apply_unop = (op: Token, v: any) => unop_microcode[op](v);
