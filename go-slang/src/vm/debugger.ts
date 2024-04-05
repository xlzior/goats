const SPACE = " ";
const PIPE = "|";
const DASH = "-";
const NEWLINE = "\n";
const STACK_NAME = "operand stack";
const LEFT_AND_RIGHT_PADDING = 2;

export function print_os(stack_in_string: string[]): void {
  const stack_width =
    LEFT_AND_RIGHT_PADDING +
    Math.max(STACK_NAME.length, length_of_longest_string(stack_in_string));
  const line_sep = format_line_sep(stack_width);
  const header = format_data_row(STACK_NAME, stack_width);
  const result = [line_sep, header, line_sep];
  stack_in_string.reverse().forEach((val) => {
    result.push(format_data_row(val, stack_width));
    result.push(line_sep);
  });
  const result_to_string = result.join(NEWLINE) + NEWLINE;
  console.log(result_to_string);
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
