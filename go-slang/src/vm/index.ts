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
import { Memory, Tag } from "./heap";

function peek<T>(stack: Array<T>, index: number = 0) {
  if (stack.length === 0) throw new Error("Stack is empty!");
  return stack[stack.length - 1 - index];
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

const apply_binop = (op: Token, v2: any, v1: any) =>
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

const apply_unop = (op: Token, v: any) => unop_microcode[op](v);

// TODO: replace with low level memory
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

// TODO: go has no unassigned
const unassigned = { _type: "unassigned" };
const is_unassigned = (v: any) => v._type === "unassigned";

function initialise_environment(builtin_mapping: Record<string, any>) {
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
  return global_environment;
}

export class GolangVM {
  private OS: Array<number>;
  private PC: number;
  private E: number;
  private RTS: Array<number>;
  private memory: Memory;
  private microcode: any;
  private builtin_mapping: Record<string, any>;

  pop_os() {
    const address = this.OS.pop();
    if (address === undefined) throw new Error(`Tried to pop from an empty OS`);
    return this.memory.address_to_js_value(address);
  }

  push_os(value: any) {
    this.OS.push(this.memory.js_value_to_address(value));
  }

  constructor(builtin_mapping: Record<string, any>) {
    this.builtin_mapping = builtin_mapping;
    this.memory = new Memory(1000000);
    this.OS = [];
    this.PC = 0;
    this.RTS = [];
    // TODO: initialise global frame
    this.E = this.memory.environment.allocate(0);
    this.microcode = {
      LDC: (instr: LDC) => {
        this.push_os(instr.val);
      },
      UNOP: (instr: UNOP) => {
        this.push_os(apply_unop(instr.sym, this.pop_os()));
      },
      BINOP: (instr: BINOP) => {
        this.push_os(apply_binop(instr.sym, this.pop_os(), this.pop_os()));
      },
      POP: (instr: POP) => {
        this.pop_os();
      },
      JOF: (instr: JOF) => {
        this.PC = this.pop_os() ? this.PC : instr.addr;
      },
      GOTO: (instr: GOTO) => {
        this.PC = instr.addr;
      },
      ENTER_SCOPE: (instr: ENTER_SCOPE) => {
        this.RTS.push(this.memory.blockframe.allocate(this.E));
        const frame_address = this.memory.frame.allocate(instr.num);
        this.E = this.memory.environment.extend(frame_address, this.E);
        for (let i = 0; i < instr.num; i++) {
          this.memory.heap.set_child(frame_address, i, unassigned);
        }
      },
      EXIT_SCOPE: (instr: EXIT_SCOPE) => {
        const scope = this.RTS.pop();
        if (scope === undefined)
          throw new Error(`Tried to exit scope when RTS is empty`);
        this.E = this.memory.blockframe.get_environment(scope);
      },
      LD: (instr: LD) => {
        const val = this.memory.environment.get_value(this.E, instr.pos);
        this.OS.push(val);
      },
      DEFINE: (instr: DEFINE) => {
        // TODO
      },
      ASSIGN: (instr: ASSIGN) => {
        this.memory.environment.set_value(this.E, instr.pos, peek(this.OS));
      },
      LDF: (instr: LDF) => {
        const closure_address = this.memory.closure.allocate(
          instr.params.length,
          instr.addr,
          this.E,
        );
        this.OS.push(closure_address);
      },
      CALL: (instr: CALL) => {
        const arity = instr.arity;
        let fun = peek(this.OS, arity);
        // TODO: implement built-in functions

        const frame_address = this.memory.frame.allocate(arity);
        for (let i = arity - 1; i >= 0; i--) {
          this.memory.heap.set_child(frame_address, i, this.OS.pop());
        }
        this.OS.pop(); // pop fun
        this.RTS.push(this.memory.callframe.allocate(this.E, this.PC));
        this.E = this.memory.environment.extend(
          frame_address,
          this.memory.closure.get_environment(fun),
        );
        this.PC = this.memory.closure.get_pc(fun);
      },
      RESET: (instr: RESET) => {
        this.PC--;
        const top_frame = this.RTS.pop();
        if (top_frame === undefined) {
          throw new Error(`Tried to RESET where RTS is empty`);
        }
        if (this.memory.heap.get_tag(top_frame) === Tag.Callframe)
          this.PC = this.memory.callframe.get_pc(top_frame);
        this.E = this.memory.callframe.get_environment(top_frame);
      },
    };
  }

  run(instrs: Instruction[]) {
    while (!(instrs[this.PC]._type === "DONE")) {
      const instr = instrs[this.PC++];
      // console.log(instr);
      if (this.microcode[instr._type]) {
        this.microcode[instr._type](instr);
      } else {
        throw new Error(`${instr._type} not implemented`);
      }
      // console.log(this.OS.map((addr) => this.memory.address_to_js_value(addr)));
    }
    return this.pop_os();
  }
}
