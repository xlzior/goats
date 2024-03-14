import { Token } from "../types/ast";
import {
  LDC,
  UNOP,
  BINOP,
  POP,
  GOTO,
  ENTER_SCOPE,
  EXIT_SCOPE,
  LD,
  ASSIGN,
  LDF,
  CALL,
  RESET,
  JOF,
  Instruction,
  DEFINE,
} from "../types/vm_instructions";

function peek(stack: Array<any>) {
  if (stack.length === 0) throw new Error("Stack is empty!");
  return stack[stack.length - 1];
}

const is_number = (val: any) => typeof val === "number";
const is_string = (val: any) => typeof val === "string";
const is_boolean = (val: any) => typeof val === "boolean";

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

const apply_binop = (op: Token, v2: number, v1: number) =>
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

const apply_unop = (op: Token, v: number | boolean) => unop_microcode[op](v);

const define_name = (name: string, env: any[]) => {
  env[0][name] = unassigned;
};

const lookup = (name: string, env: any[]): any => {
  if (env.length < 2) throw new Error(`unbound name: ${name}`);

  if (env[0].hasOwnProperty(name)) {
    const v = env[0][name];
    if (is_unassigned(v)) throw new Error(`unassigned name: ${name}`);
    return v;
  }

  return lookup(name, env[1]);
};

const assign_value = (name: string, value: any, env: any[]) => {
  if (env.length < 2) throw new Error(`unbound name: ${name}`);

  if (env[0].hasOwnProperty(name)) {
    env[0][name] = value;
  } else {
    assign_value(name, value, env[1]);
  }
};

const extend = (e: any, xs: string[] = [], vs: any[] = []) => {
  if (vs.length > xs.length) console.error("too many arguments");
  if (vs.length < xs.length) console.error("too few arguments");

  const new_frame = Object.fromEntries(
    xs.map((key, index) => [key, vs[index]]),
  );
  return [new_frame, e];
};

const unassigned = { _type: "unassigned" };

const is_unassigned = (v: any) => v._type === "unassigned";

export class GolangVM {
  private OS: Array<any>;
  private PC: number;
  private E: Array<any>;
  private RTS: Array<any>;
  private microcode: any;
  private builtin_mapping: Record<string, any>;

  constructor(builtin_mapping: Record<string, any>) {
    this.builtin_mapping = builtin_mapping;

    const global_frame: Record<string, any> = {};

    for (const key in builtin_mapping) {
      global_frame[key] = {
        _type: "BUILTIN",
        sym: key,
        arity: 1, // TODO: find the arity of the function
      };
    }

    const empty_environment: any[] = [];
    const global_environment = [global_frame, empty_environment];

    this.OS = [];
    this.PC = 0;
    this.E = global_environment;
    this.RTS = [];
    this.microcode = {
      LDC: (instr: LDC) => {
        this.OS.push(instr.val);
      },
      UNOP: (instr: UNOP) => {
        this.OS.push(apply_unop(instr.sym, this.OS.pop()));
      },
      BINOP: (instr: BINOP) => {
        this.OS.push(apply_binop(instr.sym, this.OS.pop(), this.OS.pop()));
      },
      POP: (instr: POP) => {
        this.OS.pop();
      },
      JOF: (instr: JOF) => {
        this.PC = this.OS.pop() ? this.PC : instr.addr;
      },
      GOTO: (instr: GOTO) => {
        this.PC = instr.addr;
      },
      ENTER_SCOPE: (instr: ENTER_SCOPE) => {
        this.RTS.push({ _type: "BLOCK_FRAME", env: this.E });
        this.E = extend(this.E);
      },
      EXIT_SCOPE: (instr: EXIT_SCOPE) => {
        this.E = this.RTS.pop().env;
      },
      LD: (instr: LD) => {
        this.OS.push(lookup(instr.sym, this.E));
      },
      DEFINE: (instr: DEFINE) => {
        define_name(instr.sym, this.E);
      },
      ASSIGN: (instr: ASSIGN) => {
        assign_value(instr.sym, peek(this.OS), this.E);
      },
      LDF: (instr: LDF) => {
        this.OS.push({
          _type: "CLOSURE",
          params: instr.params,
          addr: instr.addr,
          env: this.E,
        });
      },
      CALL: (instr: CALL) => {
        const arity = instr.arity;
        let args = [];
        for (let i = arity - 1; i >= 0; i--) args.push(this.OS.pop());
        const sf = this.OS.pop();
        if (sf._type === "BUILTIN") {
          const builtin = this.builtin_mapping[sf.sym](...args);
          this.OS.push(builtin);
          return;
        }
        this.RTS.push({ _type: "CALL_FRAME", addr: this.PC, env: this.E });
        this.E = extend(sf.env, sf.params, args);
        this.PC = sf.addr;
      },
      RESET: (instr: RESET) => {
        this.PC--;
        const top_frame = this.RTS.pop();
        if (top_frame._type === "CALL_FRAME") {
          this.PC = top_frame.addr;
          this.E = top_frame.env;
        }
      },
    };
  }

  run(instrs: Instruction[]) {
    while (!(instrs[this.PC]._type === "DONE")) {
      const instr = instrs[this.PC++];
      if (this.microcode[instr._type]) {
        this.microcode[instr._type](instr);
      } else {
        throw new Error(`${instr._type} not implemented`);
      }
    }
    return peek(this.OS);
  }
}
