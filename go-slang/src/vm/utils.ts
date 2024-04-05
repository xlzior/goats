import { Token } from "../types/ast";

const binop_microcode: any = {
  "+": (x: any, y: any) => x + y,
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
  "-": (x: number) => -x,
  "!": (x: boolean) => !x,
};

export const apply_unop = (op: Token, v: any) => unop_microcode[op](v);

export function add_ascii_tree(vals: string[]): string[] {
  return vals.map((val, i) =>
    i === vals.length - 1 ? `└─ ${val}` : `├─ ${val}`,
  );
}
