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
  public update_scheduler(curr_context: Context): Context {
    this.thread_instr_count++;
    if (this.thread_instr_count >= INSTRS_PER_THREAD) {
      this.thread_instr_count = 0;
      return this.context_switch(curr_context);
    }
    return curr_context;
  }

  /**
   * Switches context from the current to the next context.
   */
  public context_switch(curr_context: Context): Context {
    if (this.thread_queue.length > 0) {
      this.add_context_to_queue(curr_context);
      const next_context = this.thread_queue.shift();
      if (next_context) return next_context;
    }
    return curr_context
  }

  /**
   * Saves and adds the current context to the thread queue.
   */
  public add_context_to_queue(curr_context: Context): void {
    this.thread_queue.push(
      new Context(
        curr_context.program_counter,
        curr_context.environment,
        curr_context.operand_stack,
        curr_context.runtime_stack,
        curr_context.sleep_until,
      ),
    );
  }
}
