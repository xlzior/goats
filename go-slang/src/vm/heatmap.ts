import { Tag } from "./tag";

enum Fg {
  Default = "\x1b[39m",
  Black = "\x1b[30m",
  Dark_red = "\x1b[31m",
  Dark_green = "\x1b[32m",
  Dark_yellow = "\x1b[33m",
  Dark_blue = "\x1b[34m",
  Dark_magenta = "\x1b[35m",
  Dark_cyan = "\x1b[36m",
  Light_gray = "\x1b[37m",
  Dark_gray = "\x1b[90m",
  Red = "\x1b[91m",
  Green = "\x1b[92m",
  Orange = "\x1b[93m",
  Blue = "\x1b[94m",
  Magenta = "\x1b[95m",
  Cyan = "\x1b[96m",
  White = "\x1b[97m",
}

enum Bg {
  Default = "\x1b[49m",
  Black = "\x1b[40m",
  Dark_red = "\x1b[41m",
  Dark_green = "\x1b[42m",
  Dark_yellow = "\x1b[43m",
  Dark_blue = "\x1b[44m",
  Dark_magenta = "\x1b[45m",
  Dark_cyan = "\x1b[46m",
  Light_gray = "\x1b[47m",
  Dark_gray = "\x1b[100m",
  Red = "\x1b[101m",
  Green = "\x1b[102m",
  Orange = "\x1b[103m",
  Blue = "\x1b[104m",
  Magenta = "\x1b[105m",
  Cyan = "\x1b[106m",
  White = "\x1b[107m",
}

const RESET = "\x1b[0m";

export const colour = (fg: Fg | Bg, text: string) => `${fg}${text}${RESET}`;

enum Cell {
  values = "v",
  functions = "f",
  runtime_stack = "r",
  env = "e",
  free = " ",
}

export const tag_to_cell = (tag: Tag): Cell => {
  switch (tag) {
    case Tag.False:
    case Tag.True:
    case Tag.Undefined:
    case Tag.Number:
    case Tag.String:
    case Tag.Channel:
    case Tag.BufferedChannel:
    case Tag.Mutex:
    case Tag.WaitGroup:
      return Cell.values;

    case Tag.Closure:
    case Tag.Builtin:
      return Cell.functions;

    case Tag.Blockframe:
    case Tag.Callframe:
      return Cell.runtime_stack;

    case Tag.Environment:
    case Tag.EnvFrame:
      return Cell.env;

    default:
      return Cell.free;
  }
};

/**
 * Splits a string into an array of [char, count] pairs
 * @param str "aaabbbccc"
 * @returns [["a", 3], ["b", 3], ["c", 3]]
 */
const compressString = (str: string): [string, number][] => {
  return [...str].reduce<[string, number][]>(
    (acc, char) =>
      acc.length === 0 || acc[acc.length - 1][0] !== char
        ? [...acc, [char, 1]]
        : (acc[acc.length - 1][1]++, acc),
    [],
  );
};

const centralised = (c: string, n: number): string =>
  Array.from({ length: n }, (_, i) =>
    i === Math.floor((n - 1) / 2) ? c : " ",
  ).join("");

const coloured = (cell: Cell, n: number): string => {
  const text = centralised(cell, n);
  switch (cell) {
    case Cell.values:
      return colour(Bg.White, text);
    case Cell.functions:
      return colour(Bg.Dark_green, text);
    case Cell.runtime_stack:
      return colour(Bg.Dark_red, text);
    case Cell.env:
      return colour(Bg.Blue, text);
    case Cell.free:
      return text;
  }
};

export const heatmap = (str: string) => {
  const compressed = compressString(str);
  return compressed.map(([cell, n]) => coloured(cell as Cell, n)).join("");
};

export const heatmap_legend: string = `Heatmap Legend:
${coloured(Cell.values, 1)} - Values
${coloured(Cell.functions, 1)} - Functions
${coloured(Cell.runtime_stack, 1)} - Runtime Stack Frames (Callframes and Blockframes)
${coloured(Cell.env, 1)} - Environments (Environment and EnvFrame)
${coloured(Cell.free, 1)} - Free Space
`;
