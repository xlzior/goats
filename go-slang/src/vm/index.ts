import { RuntimeError } from "../errors";
import { InternalBuiltinNames } from "../internal_builtins";
import { BuiltinFunction } from "../types";
import * as VM from "../types/vm_instructions";
import { peek } from "../utils";
import { Config } from "./config";
import { print_stack } from "./debugger";
import { NODE_SIZE } from "./heap";
import { heatmap, heatmap_legend, tag_to_cell } from "./heatmap";
import { Memory } from "./memory";
import { format_address, to_tree } from "./memory_display";
import { Tag } from "./tag";
import { Context } from "./thread_context";
import { DEADLOCK_THRESHOLD, ThreadManager } from "./thread_manager";
import { apply_binop, apply_unop } from "./utils";

export class GolangVM {
  private ctx: Context;
  private memory: Memory;
  private builtins: Array<BuiltinFunction>;
  private thread_manager: ThreadManager;
  private println: (val: any) => void;
  private heatmap_legend_printed = false;
  private config: Config;

  constructor(
    external_builtins: Record<string, BuiltinFunction> = {},
    config: Config,
  ) {
    this.config = config;

    this.memory = new Memory(config.memory, this.get_roots.bind(this));
    this.builtins = [
      ...Object.values(this.internal_builtins),
      ...Object.values(external_builtins),
    ];
    this.println = (val: any) => external_builtins["Println"].apply(val);
    this.ctx = new Context(0, this.initialise_environment());
    this.thread_manager = new ThreadManager();
  }

  private initialise_environment() {
    const empty_environment = this.memory.environment.allocate(0);
    const global_frame = this.memory.frame.allocate(this.builtins.length);

    this.builtins.forEach((fn, i) => {
      this.memory.heap.set_child(
        global_frame,
        i,
        this.memory.builtin.allocate(i),
      );
    });

    const env = this.memory.environment.extend(global_frame, empty_environment);
    this.memory.heap.set_bottom();
    return env;
  }

  run(instrs: VM.Instruction[]) {
    while (!(instrs[this.ctx.program_counter]._type === "DONE")) {
      if (this.is_sleeping) {
        this.ctx = this.thread_manager.context_switch(this.ctx);
        continue;
      }

      if (
        this.ctx.consecutive_blocks > DEADLOCK_THRESHOLD &&
        this.thread_manager.all_blocked()
      ) {
        throw new RuntimeError("Deadlock detected: All threads are blocked");
      }

      const instr = instrs[this.ctx.program_counter++];
      if (this.microcode[instr._type] === undefined)
        throw new RuntimeError(`${instr._type} not supported`);

      if (this.config.debug_os) {
        const content_in_string = this.ctx.operand_stack.map((addr) => {
          const val = this.memory.address_to_js_value(addr);
          return val === undefined ? "undefined" : JSON.stringify(val);
        });
        print_stack("operand stack", content_in_string);
      }

      this.microcode[instr._type](instr);

      this.ctx = this.thread_manager.get_context(this.ctx);
    }
    return this.pop_os();
  }

  internal_builtins: Record<InternalBuiltinNames, BuiltinFunction> = {
    // NOTE: Ensure that the order of keys matches the order of the enum
    Sleep: {
      arity: 1,
      apply: (duration: number) => {
        this.ctx.sleep_until = new Date(Date.now() + duration);
      },
    },
    make: {
      arity: 1,
      apply: (capacity: number) => {
        if (capacity === 0) {
          return this.memory.channel.allocate();
        } else {
          return this.memory.buffered_channel.allocate(capacity);
        }
      },
    },
    PrintHeap: {
      arity: 0,
      apply: () => {
        this.println("Heap:");
        let i = 0;
        while (i <= this.memory.heap.max_allocated_address) {
          const obj = this.memory.address_to_object(i);
          if (obj.is_empty()) {
            i += NODE_SIZE;
            continue;
          }

          this.println(`${format_address(i)}: ${obj.to_string()}`);

          if (obj.children && obj.children.length > 0) {
            const children = obj.children_to_tree(this.memory);
            const tree = to_tree(children)
              .split("\n")
              .map((child, j) => `${format_address(i + j + 1)}: ${child}`);

            this.println(tree.join("\n"));
          }
          i += NODE_SIZE;
        }
      },
    },
    PrintHeatMap: {
      arity: 0,
      apply: () => {
        if (!this.heatmap_legend_printed) {
          this.println(heatmap_legend);
          this.heatmap_legend_printed = true;
        }

        let i = 0;
        let row = [];
        while (i < this.memory.heap.heap_size) {
          const tag = this.memory.heap.get_tag(i);
          row.push(tag_to_cell(tag));
          i += NODE_SIZE;
        }
        if (row.length > 0) this.println(heatmap(row.join("")));
      },
    },
    PrintEnvironment: {
      arity: 0,
      apply: () => {
        this.println(
          "Environment (top = global frame, bottom = current frame):",
        );
        const addr = this.ctx.environment;
        const env = this.memory.address_to_object(addr);
        this.println(env.to_string());

        const tree: Record<string, Record<string, any>> = {};
        if (env.children) {
          env.children.forEach((frame_addr) => {
            const frame = this.memory.address_to_object(frame_addr);
            const items = frame.children_to_tree(this.memory);
            tree[frame.to_string()] = items;
          });
        }
        this.println(to_tree(tree));
      },
    },
    PrintRuntimeStack: {
      arity: 0,
      apply: () => {
        this.println(
          "Runtime Stack (top = top of stack, bottom = bottom of stack):",
        );
        const stack = this.ctx.runtime_stack.reverse().map((addr) => {
          const stackframe = this.memory.address_to_object(addr);
          const children = stackframe.children_to_tree(this.memory);

          const env = stackframe.children![0];
          const env_obj = this.memory.address_to_object(env);
          const last_frame = env_obj.children![env_obj.children!.length - 1];
          const last_frame_obj = this.memory.address_to_object(last_frame);
          const frame_children = last_frame_obj.children_to_tree(this.memory);

          return [
            stackframe.to_string(),
            to_tree(children),
            to_tree(frame_children)
              .split("\n")
              .map((line) => "    " + line)
              .join("\n"),
          ]
            .join("\n")
            .trim();
        });
        this.println(stack.join("\n\n"));
      },
    },
  };

  private get is_sleeping() {
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
      context.consecutive_blocks = this.ctx.consecutive_blocks;
    }

    return context;
  }

  private get_roots(): number[] {
    // left with handling temp roots
    return [...this.ctx.get_roots(), ...this.thread_manager.get_roots()];
  }

  private pop_os() {
    const address = this.ctx.operand_stack.pop();
    if (address === undefined) {
      // unnecessary pop from empty stack due to some intricacies in block statement
      return undefined;
    }
    return this.memory.address_to_js_value(address);
  }

  private push_os(value: any) {
    this.ctx.operand_stack.push(this.memory.js_value_to_address(value));
  }

  private apply_builtin(id: number) {
    const { arity, apply } = this.builtins[id];
    const args = [];
    for (let i = 0; i < arity; i++) {
      args.push(this.pop_os());
    }
    const result = apply.apply(null, args) ?? this.memory.Undefined;
    this.ctx.operand_stack.pop(); // pop fun
    this.ctx.operand_stack.push(result);
  }

  private microcode: Record<VM.Instruction["_type"], any> = {
    LDC: (instr: VM.LDC) => {
      this.push_os(instr.val);
    },
    MAKE_MUTEX: (instr: VM.MAKE_MUTEX) => {
      const mutex_addr = this.memory.mutex.allocate();
      this.ctx.operand_stack.push(mutex_addr); // mutex var is assigned with its address as value
    },
    MAKE_WAITGROUP: (instr: VM.MAKE_WAITGROUP) => {
      const wg_addr = this.memory.wait_group.allocate();
      this.ctx.operand_stack.push(wg_addr); // wg var is assigned with its address as value
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
        this.memory.heap.set_child(frame_address, i, this.memory.Undefined);
        // value is not set here, it is set by the ASSIGN instruction
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
        // builtins are just run in the current thread, not in a separate thread
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
    SEND: (instr: VM.SEND) => {
      const value = peek(this.ctx.operand_stack);
      const channel_addr = peek(this.ctx.operand_stack, 1);
      const channel = this.memory.address_to_channel(channel_addr);

      const success = channel.enqueue(value);
      if (!success) {
        this.ctx.program_counter--;
        this.thread_manager.blocked(this.ctx);
        this.ctx = this.thread_manager.context_switch(this.ctx);
        return;
      }
      this.thread_manager.unblocked(this.ctx);
      this.thread_manager.unblock_all();
      this.pop_os(); // pop channel
      this.pop_os(); // pop value
    },
    RECV: (instr: VM.RECV) => {
      const channel_addr = peek(this.ctx.operand_stack);
      const channel = this.memory.address_to_channel(channel_addr);

      const value = channel.dequeue();
      if (value === this.memory.Undefined) {
        this.ctx.program_counter--;
        this.thread_manager.blocked(this.ctx);
        this.ctx = this.thread_manager.context_switch(this.ctx);
        return;
      }
      this.thread_manager.unblocked(this.ctx);
      this.thread_manager.unblock_all();
      this.pop_os(); // pop channel
      this.ctx.operand_stack.push(value);
    },
    LOCK: (instr: VM.LOCK) => {
      const mutex_addr = peek(this.ctx.operand_stack);
      if (!this.memory.mutex.is_available(mutex_addr)) {
        this.ctx.program_counter--;
        this.thread_manager.blocked(this.ctx);
        this.ctx = this.thread_manager.context_switch(this.ctx);
        return;
      }
      this.thread_manager.unblocked(this.ctx);
      this.memory.mutex.acquire(mutex_addr);
      this.pop_os();
    },
    UNLOCK: (instr: VM.UNLOCK) => {
      const mutex_addr = peek(this.ctx.operand_stack);
      this.memory.mutex.release(mutex_addr);
      this.thread_manager.unblock_all();
      this.pop_os();
    },
    WG_ADD: (instr: VM.WG_ADD) => {
      const count = this.pop_os() as number;
      const wg_addr = peek(this.ctx.operand_stack);
      this.memory.wait_group.update_counter(wg_addr, count);
      this.pop_os();
    },
    WG_DONE: (instr: VM.WG_DONE) => {
      const wg_addr = peek(this.ctx.operand_stack);
      this.memory.wait_group.update_counter(wg_addr, -1);
      this.thread_manager.unblock_all();
      this.pop_os();
    },
    WG_WAIT: (instr: VM.WG_WAIT) => {
      const wg_addr = peek(this.ctx.operand_stack);
      if (!this.memory.wait_group.is_done(wg_addr)) {
        this.ctx.program_counter--;
        this.thread_manager.blocked(this.ctx);
        this.ctx = this.thread_manager.context_switch(this.ctx);
        return;
      }
      this.thread_manager.unblocked(this.ctx);
      this.pop_os();
    },
    DONE: (instr: VM.DONE) => {},
  };
}
