import { BuiltinFunction } from "../types";
import * as VM from "../types/vm_instructions";

import { peek } from "../utils";
import { apply_unop, apply_binop } from "./utils";

import { Memory } from "./memory";
import { Tag } from "./tag";
import { Context } from "./thread_context";

const INSTRS_PER_THREAD = 10;

export class GolangVM {
  private OS: Array<number>;
  private PC: number;
  private E: number;
  private RTS: Array<number>;
  private sleep_until: Date;

  private memory: Memory;
  private builtin_array: Array<BuiltinFunction>;
  private thread_queue: Array<Context>;
  private thread_instr_count: number = 0;

  constructor(builtin_mapping: Record<string, BuiltinFunction>) {
    this.memory = new Memory(10000000);
    this.builtin_array = [this.Sleep, ...Object.values(builtin_mapping)];
    this.thread_queue = [];

    this.OS = [];
    this.PC = 0;
    this.RTS = [];
    this.E = this.initialise_environment();
    this.sleep_until = new Date();
  }

  private initialise_environment() {
    const empty_environment = this.memory.environment.allocate(0);
    const global_frame = this.memory.frame.allocate(this.builtin_array.length);

    this.builtin_array.forEach((fn, i) => {
      this.memory.heap.set_child(
        global_frame,
        i,
        this.memory.builtin.allocate(i),
      );
    });

    return this.memory.environment.extend(global_frame, empty_environment);
  }

  run(instrs: VM.Instruction[]) {
    while (!(instrs[this.PC]._type === "DONE")) {
      if (this.is_sleeping()) {
        this.context_switch();
        continue;
      }

      const instr = instrs[this.PC++];
      if (this.microcode[instr._type] === undefined)
        throw new Error(`${instr._type} not supported`);
      this.microcode[instr._type](instr);

      this.update_scheduler();
    }
    return this.pop_os();
  }

  private Sleep: BuiltinFunction = {
    arity: 1,
    apply: (duration: number) => {
      this.sleep_until = new Date(Date.now() + duration);
    },
  };

  private is_sleeping(): boolean {
    return new Date() < this.sleep_until;
  }

  private update_scheduler() {
    this.thread_instr_count++;

    if (this.thread_instr_count >= INSTRS_PER_THREAD) {
      this.thread_instr_count = 0;
      this.context_switch();
    }
  }

  private context_switch() {
    if (this.thread_queue.length > 0) {
      this.save_context();
      this.restore_context();
    }
  }

  private save_context() {
    this.thread_queue.push(
      new Context(this.PC, this.E, this.OS, this.RTS, this.sleep_until),
    );
  }

  private restore_context() {
    const context = this.thread_queue.shift();
    if (context === undefined) return;

    this.PC = context.PC;
    this.E = context.E;
    this.OS = context.OS;
    this.RTS = context.RTS;
    this.sleep_until = context.sleep_until;
  }

  private pop_os() {
    const address = this.OS.pop();
    if (address === undefined) {
      return undefined;
      // TODO: throw error? sign that there is an unecessary pop
      // throw new Error(`Tried to pop from an empty OS`);
    }
    return this.memory.address_to_js_value(address);
  }

  private push_os(value: any) {
    this.OS.push(this.memory.js_value_to_address(value));
  }

  private apply_builtin(id: number) {
    const { arity, apply } = this.builtin_array[id];
    const args = [];
    for (let i = 0; i < arity; i++) {
      args.push(this.pop_os());
    }
    const result = apply.apply(null, args);
    this.push_os(result);
  }

  private microcode: Record<VM.Instruction["_type"], any> = {
    LDC: (instr: VM.LDC) => {
      this.push_os(instr.val);
    },
    UNOP: (instr: VM.UNOP) => {
      this.push_os(apply_unop(instr.sym, this.pop_os()));
    },
    BINOP: (instr: VM.BINOP) => {
      this.push_os(apply_binop(instr.sym, this.pop_os(), this.pop_os()));
    },
    POP: (instr: VM.POP) => {
      this.pop_os();
    },
    JOF: (instr: VM.JOF) => {
      this.PC = this.pop_os() ? this.PC : instr.addr;
    },
    GOTO: (instr: VM.GOTO) => {
      this.PC = instr.addr;
    },
    ENTER_SCOPE: (instr: VM.ENTER_SCOPE) => {
      this.RTS.push(this.memory.blockframe.allocate(this.E));
      const frame_address = this.memory.frame.allocate(instr.num);
      this.E = this.memory.environment.extend(frame_address, this.E);
      for (let i = 0; i < instr.num; i++) {
        // TODO: how to initialise the variables? unassigned?
        // this currently initialises all variables to the address of 0, which is False
        this.memory.heap.set_child(frame_address, i, 0);
      }
    },
    EXIT_SCOPE: (instr: VM.EXIT_SCOPE) => {
      const scope = this.RTS.pop();
      if (scope === undefined)
        throw new Error(`Tried to exit scope when RTS is empty`);
      this.E = this.memory.blockframe.get_environment(scope);
    },
    LD: (instr: VM.LD) => {
      const val = this.memory.environment.get_value(this.E, instr.pos);
      this.OS.push(val);
    },
    ASSIGN: (instr: VM.ASSIGN) => {
      this.memory.environment.set_value(this.E, instr.pos, peek(this.OS));
    },
    LDF: (instr: VM.LDF) => {
      const closure_address = this.memory.closure.allocate(
        instr.params.length,
        instr.addr,
        this.E,
      );
      this.OS.push(closure_address);
    },
    CALL: (instr: VM.CALL) => {
      const arity = instr.arity;
      let fun = peek(this.OS, arity);
      const tag = this.memory.heap.get_tag(fun);

      if (tag === Tag.Builtin) {
        return this.apply_builtin(this.memory.builtin.get_id(fun));
      }

      if (tag === Tag.Closure) {
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
        return;
      }

      throw new Error(`Tried to CALL on a non-function type: tag ${tag}`);
    },
    THREAD_CALL: (instr: VM.THREAD_CALL) => {
      const arity = instr.arity;
      let fun = peek(this.OS, arity);
      const tag = this.memory.heap.get_tag(fun);

      if (tag === Tag.Builtin) {
        // TODO: implement go for builtin functions
        // this currently just runs them in the current thread, not in a separate thread
        return this.apply_builtin(this.memory.builtin.get_id(fun));
      }

      if (tag === Tag.Closure) {
        const frame_address = this.memory.frame.allocate(arity);
        for (let i = arity - 1; i >= 0; i--) {
          this.memory.heap.set_child(frame_address, i, this.OS.pop());
        }
        this.OS.pop(); // pop fun

        const context = new Context(
          this.memory.closure.get_pc(fun),
          this.memory.environment.extend(
            frame_address,
            this.memory.closure.get_environment(fun),
          ),
        );
        this.thread_queue.push(context);
        return;
      }

      throw new Error(`Tried to CALL on a non-function type: tag ${tag}`);
    },
    RESET: (instr: VM.RESET) => {
      this.PC--;
      const top_frame = this.RTS.pop();
      if (top_frame === undefined) return this.restore_context();

      if (this.memory.heap.get_tag(top_frame) === Tag.Callframe)
        this.PC = this.memory.callframe.get_pc(top_frame);
      this.E = this.memory.callframe.get_environment(top_frame);
    },
    DONE: (instr: VM.DONE) => {},
  };
}
