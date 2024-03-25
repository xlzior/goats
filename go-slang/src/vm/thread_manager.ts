import { Context } from "./thread_context";

const INSTRS_PER_THREAD = 10;

/**
 * Represents a manager for handling threads and context switching.
 */
export class ThreadManager {
  private thread_queue: Array<Context>;
  private thread_instr_count: number;

  constructor() {
    this.thread_queue = [];
    this.thread_instr_count = 0;
  }

  /**
   * Updates the scheduler based on the current context.
   */
  public update_scheduler(curr_ctx: Context): Context {
    this.thread_instr_count++;
    if (this.thread_instr_count >= INSTRS_PER_THREAD) {
      this.thread_instr_count = 0;
      return this.context_switch(curr_ctx);
    }
    return curr_ctx;
  }

  /**
   * Switches context from the current to
   * the next context from the thread queue.
   */
  public context_switch(curr_ctx: Context): Context {
    if (this.thread_queue.length > 0) {
      this.add_context_to_queue(curr_ctx);
      const next_ctx = this.thread_queue.shift();
      if (next_ctx) return next_ctx;
    }
    return curr_ctx;
  }

  /**
   * Saves and adds the current context to the thread queue.
   */
  public add_context_to_queue(curr_ctx: Context): void {
    this.thread_queue.push(
      new Context(
        curr_ctx.program_counter,
        curr_ctx.environment,
        curr_ctx.operand_stack,
        curr_ctx.runtime_stack,
        curr_ctx.sleep_until,
      ),
    );
  }
}
