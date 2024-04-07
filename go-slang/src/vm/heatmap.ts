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

const values = colour(Bg.White, "v");
const functions = colour(Bg.Dark_red, "f");
const runtime_stack = colour(Bg.Green, "r");
const environments = colour(Bg.Blue, "e");
const free = " ";

export const tag_to_cell = (tag: Tag): string => {
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
      return values;

    case Tag.Closure:
    case Tag.Builtin:
      return functions;

    case Tag.Blockframe:
    case Tag.Callframe:
      return runtime_stack;

    case Tag.Environment:
    case Tag.EnvFrame:
      return environments;

    default:
      return free;
  }
};

export const heatmap_legend: string = `Heatmap Legend:
${values} - Values
${functions} - Functions
${runtime_stack} - Runtime Stack Frames (Callframes and Blockframes)
${environments} - Environments (Environment and EnvFrame)
${free} - Free Space
`;
