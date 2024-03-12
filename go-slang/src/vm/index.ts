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
} from "../types/vm_instructions";

function peek(stack: Array<any>) {
  if (stack.length === 0) throw new Error("Stack is empty!");
  return stack[stack.length - 1];
}

const is_number = (val: any) => typeof val === "number";
const is_string = (val: any) => typeof val === "string";

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

const apply_binop = (op: Token, v2: number | boolean, v1: number | boolean) =>
  binop_microcode[op](v1, v2);

const unop_microcode: any = {
  "-": (x: number) => {
    if (typeof x !== "number") throw new Error(`- expects a number, got: ${x}`);
    return -x;
  },
  "!": (x: boolean) => {
    if (typeof x !== "boolean")
      throw new Error(`! expects a boolean, got: ${x}`);
    return !x;
  },
};

const apply_unop = (op: Token, v: number | boolean) => unop_microcode[op](v);

const lookup = (x: string, e: any[]): any => {
  if (e.length < 2) throw new Error(`unbound name: ${x}`);

  if (e[0].hasOwnProperty(x)) {
    const v = e[0][x];
    if (is_unassigned(v)) throw new Error(`unassigned name: ${x}`);
    return v;
  }

  return lookup(x, e[1]);
};

const assign_value = (x: string, v: any, e: any[]) => {
  if (e.length < 2) throw new Error(`unbound name: ${x}`);

  if (e[0].hasOwnProperty(x)) {
    e[0][x] = v;
  } else {
    assign_value(x, v, e[1]);
  }
};

const extend = (xs: string[], vs: any[], e: any) => {
  if (vs.length > xs.length) console.error("too many arguments");
  if (vs.length < xs.length) console.error("too few arguments");

  const new_frame = Object.fromEntries(
    xs.map((key, index) => [key, vs[index]])
  );
  return [new_frame, e];
};

const unassigned = { tag: "unassigned" };

const is_unassigned = (v: any) => v.tag === "unassigned";

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
        tag: "BUILTIN",
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
        this.PC++;
        this.OS.push(instr.val);
      },
      UNOP: (instr: UNOP) => {
        this.PC++;
        this.OS.push(apply_unop(instr.sym, this.OS.pop()));
      },
      BINOP: (instr: BINOP) => {
        this.PC++;
        this.OS.push(apply_binop(instr.sym, this.OS.pop(), this.OS.pop()));
      },
      POP: (instr: POP) => {
        this.PC++;
        this.OS.pop();
      },
      JOF: (instr: JOF) => {
        this.PC = this.OS.pop() ? this.PC + 1 : instr.addr;
      },
      GOTO: (instr: GOTO) => {
        this.PC = instr.addr;
      },
      ENTER_SCOPE: (instr: ENTER_SCOPE) => {
        this.PC++;
        this.RTS.push({ tag: "BLOCK_FRAME", env: this.E });
        const locals = instr.syms;
        const unassigneds = locals.map(() => unassigned);
        this.E = extend(locals, unassigneds, this.E);
      },
      EXIT_SCOPE: (instr: EXIT_SCOPE) => {
        this.PC++;
        this.E = this.RTS.pop().env;
      },
      LD: (instr: LD) => {
        this.PC++;
        this.OS.push(lookup(instr.sym, this.E));
      },
      ASSIGN: (instr: ASSIGN) => {
        this.PC++;
        assign_value(instr.sym, peek(this.OS), this.E);
      },
      LDF: (instr: LDF) => {
        this.PC++;
        this.OS.push({
          tag: "CLOSURE",
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
        if (sf.tag === "BUILTIN") {
          this.PC++;
          const builtin = this.builtin_mapping[sf.sym](...args);
          this.OS.push(builtin);
          return;
        }
        this.RTS.push({ tag: "CALL_FRAME", addr: this.PC + 1, env: this.E });
        this.E = extend(sf.params, args, sf.env);
        this.PC = sf.addr;
      },
      RESET: (instr: RESET) => {
        const top_frame = this.RTS.pop();
        if (top_frame.tag === "CALL_FRAME") {
          this.PC = top_frame.addr;
          this.E = top_frame.env;
        }
      },
    };
  }

  run(instrs: Instruction[]) {
    while (!(instrs[this.PC].tag === "DONE")) {
      const instr = instrs[this.PC];
      if (this.microcode[instr.tag]) {
        this.microcode[instr.tag](instr);
      } else {
        throw new Error(`${instr.tag} not implemented`);
      }
    }
    return peek(this.OS);
  }
}
