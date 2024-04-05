const SPACE = " ";
const PIPE = "|";
const DASH = "-";
const NEWLINE = "\n";
const LEFT_AND_RIGHT_PADDING = 2;

/**
 * Display and formats stack content into a single-line, well-structured stack representation.
 *
 * @param {string} name - The name of the stack.
 * @param {string[]} content - The content of the stack represented as an array of strings.
 * @returns {void}
 */
export function print_stack(name: string, content: string[]): void {
  const stack_width =
    LEFT_AND_RIGHT_PADDING +
    Math.max(name.length, length_of_longest_string(content));
  const line_sep = format_line_sep(stack_width);
  const header = format_data_row(name, stack_width);
  const result = [line_sep, header, line_sep];
  for (let i = content.length - 1; i >= 0; i--) {
    result.push(format_data_row(content[i], stack_width));
    result.push(line_sep);
  }
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
