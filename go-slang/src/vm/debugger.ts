import { Memory } from "./memory";

const SPACE = " ";
const PIPE = "|";
const DASH = "-";
const NEWLINE = "\n";
const STACK_NAME = "operand stack";
const LEFT_AND_RIGHT_PADDING = 2;

/**
 * Displays the operand stack in a nicely-formatted stack structure
 */
export function print_os(os: number[], memory: Memory): void {
  const stack_in_string = os.map((addr) => {
    const val = memory.address_to_js_value(addr);
    return val === undefined ? "undefined" : JSON.stringify(val);
  });
  const formatted_stack = format_stack(stack_in_string);
  console.log(formatted_stack);
}

function format_stack(stack_in_string: string[]): string {
  const stack_width =
    LEFT_AND_RIGHT_PADDING +
    Math.max(STACK_NAME.length, length_of_longest_string(stack_in_string));
  const line_sep = format_line_sep(stack_width);
  const header = format_data_row(STACK_NAME, stack_width);
  const result = [line_sep, header, line_sep];
  for (let i = stack_in_string.length - 1; i >= 0; i--) {
    result.push(format_data_row(stack_in_string[i], stack_width));
    result.push(line_sep);
  }
  const result_to_string = result.join(NEWLINE) + NEWLINE;
  return result_to_string;
}

function format_line_sep(stack_width: number): string {
  return PIPE + DASH.repeat(stack_width) + PIPE;
}

function format_data_row(data: string, stack_width: number): string {
  return (
    PIPE +
    SPACE +
    data +
    SPACE.repeat(stack_width - data.length - LEFT_AND_RIGHT_PADDING) +
    SPACE +
    PIPE
  );
}

function length_of_longest_string(arr: string[]): number {
  let max_len = 0;
  for (const str of arr) {
    max_len = Math.max(str.length, max_len);
  }
  return max_len;
}
