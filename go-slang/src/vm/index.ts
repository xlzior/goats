import { BuiltinFunction } from "../types";
import * as VM from "../types/vm_instructions";

import { peek } from "../utils";
import { apply_unop, apply_binop } from "./utils";

import { Memory } from "./memory";
import { Tag } from "./tag";
import { Context } from "./thread_context";

import { RuntimeError } from "../errors";
import { ThreadManager } from "./thread_manager";

export class GolangVM {
  private ctx: Context;
  private memory: Memory;
  private builtin_array: Array<BuiltinFunction>;
  private thread_manager: ThreadManager;

  constructor(builtin_mapping: Record<string, BuiltinFunction>) {
    this.memory = new Memory(10000000);
    this.builtin_array = [this.Sleep, ...Object.values(builtin_mapping)];
    this.ctx = new Context(0, this.initialise_environment());
    this.thread_manager = new ThreadManager();
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
    while (!(instrs[this.ctx.program_counter]._type === "DONE")) {
      if (this.is_sleeping()) {
        this.ctx = this.thread_manager.context_switch(this.ctx);
        continue;
      }

      const instr = instrs[this.ctx.program_counter++];
      if (this.microcode[instr._type] === undefined)
        throw new RuntimeError(`${instr._type} not supported`);
      this.microcode[instr._type](instr);

      this.ctx = this.thread_manager.update_scheduler(this.ctx);
    }
    return this.pop_os();
  }

  private Sleep: BuiltinFunction = {
    arity: 1,
    apply: (duration: number) => {
      this.ctx.sleep_until = new Date(Date.now() + duration);
    },
  };

  private is_sleeping(): boolean {
    return new Date() < this.ctx.sleep_until;
  }

  private create_function_context(
    fun: number,
    arity: number,
    extend_current: boolean,
  ) {
    const frame_address = this.memory.frame.allocate(arity);
    for (let i = arity - 1; i >= 0; i--) {
      this.memory.heap.set_child(
        frame_address,
        i,
        this.ctx.operand_stack.pop(),
      );
    }
    this.ctx.operand_stack.pop(); // pop fun

    const context = new Context(
      this.memory.closure.get_pc(fun),
      this.memory.environment.extend(
        frame_address,
        this.memory.closure.get_environment(fun),
      ),
    );

    if (extend_current) {
      context.operand_stack = this.ctx.operand_stack;
      context.runtime_stack = this.ctx.runtime_stack;
      context.sleep_until = this.ctx.sleep_until;
    }

    return context;
  }

  private pop_os() {
    const address = this.ctx.operand_stack.pop();
    if (address === undefined) {
      return undefined;
      // TODO: throw error? sign that there is an unecessary pop
      // throw new RuntimeError(`Tried to pop from an empty OS`);
    }
    return this.memory.address_to_js_value(address);
  }

  private push_os(value: any) {
    this.ctx.operand_stack.push(this.memory.js_value_to_address(value));
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
      this.ctx.program_counter = this.pop_os()
        ? this.ctx.program_counter
        : instr.addr;
    },
    GOTO: (instr: VM.GOTO) => {
      this.ctx.program_counter = instr.addr;
    },
    ENTER_SCOPE: (instr: VM.ENTER_SCOPE) => {
      this.ctx.runtime_stack.push(
        this.memory.blockframe.allocate(this.ctx.environment),
      );
      const frame_address = this.memory.frame.allocate(instr.num);
      this.ctx.environment = this.memory.environment.extend(
        frame_address,
        this.ctx.environment,
      );
      for (let i = 0; i < instr.num; i++) {
        // TODO: how to initialise the variables? unassigned?
        // this currently initialises all variables to the address of 0, which is False
        this.memory.heap.set_child(frame_address, i, 0);
      }
    },
    EXIT_SCOPE: (instr: VM.EXIT_SCOPE) => {
      const scope = this.ctx.runtime_stack.pop();
      if (scope === undefined)
        throw new RuntimeError(`Tried to exit scope when RTS is empty`);
      this.ctx.environment = this.memory.blockframe.get_environment(scope);
    },
    LD: (instr: VM.LD) => {
      const val = this.memory.environment.get_value(
        this.ctx.environment,
        instr.pos,
      );
      this.ctx.operand_stack.push(val);
    },
    ASSIGN: (instr: VM.ASSIGN) => {
      this.memory.environment.set_value(
        this.ctx.environment,
        instr.pos,
        peek(this.ctx.operand_stack),
      );
    },
    LDF: (instr: VM.LDF) => {
      const closure_address = this.memory.closure.allocate(
        instr.params.length,
        instr.addr,
        this.ctx.environment,
      );
      this.ctx.operand_stack.push(closure_address);
    },
    CALL: (instr: VM.CALL) => {
      const arity = instr.arity;
      const fun = peek(this.ctx.operand_stack, arity);
      const tag = this.memory.heap.get_tag(fun);

      if (tag === Tag.Builtin) {
        return this.apply_builtin(this.memory.builtin.get_id(fun));
      }

      if (tag === Tag.Closure) {
        this.ctx.runtime_stack.push(
          this.memory.callframe.allocate(
            this.ctx.environment,
            this.ctx.program_counter,
          ),
        );
        this.ctx = this.create_function_context(fun, arity, true);
        return;
      }

      throw new RuntimeError(`invalid operation: cannot call non-function`);
    },
    THREAD_CALL: (instr: VM.THREAD_CALL) => {
      const arity = instr.arity;
      const fun = peek(this.ctx.operand_stack, arity);
      const tag = this.memory.heap.get_tag(fun);

      if (tag === Tag.Builtin) {
        // TODO: implement go for builtin functions
        // this currently just runs them in the current thread, not in a separate thread
        return this.apply_builtin(this.memory.builtin.get_id(fun));
      }

      if (tag === Tag.Closure) {
        const context = this.create_function_context(fun, arity, false);
        this.thread_manager.add_context_to_queue(context);
        return;
      }

      throw new RuntimeError(`invalid operation: cannot call non-function`);
    },
    RESET: (instr: VM.RESET) => {
      this.ctx.program_counter--;
      const top_frame = this.ctx.runtime_stack.pop();
      if (top_frame === undefined) {
        this.ctx = this.thread_manager.restore_context() ?? this.ctx;
        return;
      }

      if (this.memory.heap.get_tag(top_frame) === Tag.Callframe)
        this.ctx.program_counter = this.memory.callframe.get_pc(top_frame);
      this.ctx.environment = this.memory.callframe.get_environment(top_frame);
    },
    DONE: (instr: VM.DONE) => {},
  };
}
