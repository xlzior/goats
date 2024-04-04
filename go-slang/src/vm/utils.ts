import { Token } from "../types/ast";
import { strip_quotes } from "../utils";

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

const SPACE = " "
const PIPE = "|"
const DASH = "-"
const NEWLINE = "\n"
const TOP_INDICATOR = " <-- top"
const BTM_INDICATOR = " <-- bottom"
const STACK_NAME = "operand stack"
const PADDING_LEN = 5

export function format_stack(stack_in_string: string[]): string {
  const stack_width = Math.min(STACK_NAME.length, length_of_longest_string(stack_in_string)) + PADDING_LEN
  const line_separator = PIPE + DASH.repeat(stack_width) + PIPE
  const header = format_data_row(STACK_NAME, stack_width)
  const result = [line_separator, header, line_separator]
  stack_in_string.forEach((val, i) => {
    let data_row = format_data_row(val, stack_width)
    if (i === 0) data_row += TOP_INDICATOR
    if (i !== 0 && i === stack_in_string.length - 1) data_row += BTM_INDICATOR
    result.push(data_row)
    result.push(line_separator)
  })
  return result.join(NEWLINE)
}

function format_data_row(data: string, stack_width: number): string {
  const cleaned_data = strip_quotes(data)
  return PIPE + SPACE + cleaned_data + SPACE.repeat(Math.max(0, stack_width - cleaned_data.length - 2)) + SPACE + PIPE
}

function length_of_longest_string(arr: string[]): number {
  return Math.max(...arr.map(str => str.length));
}
