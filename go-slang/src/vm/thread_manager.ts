import { Context } from "./thread_context";

const TIME_QUANTUM = 1; // ms
export const DEADLOCK_THRESHOLD = 2; // consecutive blocks

/**
 * Represents a manager for handling threads and context switching.
 */
export class ThreadManager {
  private thread_queue: Array<Context>;
  private last_context_switch: Date;

  constructor() {
    this.thread_queue = [];
    this.last_context_switch = new Date();
  }

  get time_since_last_context_switch(): number {
    return new Date().getTime() - this.last_context_switch.getTime();
  }

  get_roots(): number[] {
    return this.thread_queue.flatMap((ctx) => ctx.get_roots());
  }

  all_blocked(): boolean {
    return this.thread_queue.every(
      (ctx) => ctx.consecutive_blocks > DEADLOCK_THRESHOLD,
    );
  }

  blocked(ctx: Context): void {
    ctx.consecutive_blocks++;
  }

  unblocked(ctx: Context): void {
    ctx.consecutive_blocks = 0;
  }

  unblock_all(): void {
    this.thread_queue.forEach((ctx) => (ctx.consecutive_blocks = 0));
  }

  /**
   * Updates the scheduler based on the current context.
   */
  public get_context(curr_ctx: Context): Context {
    if (this.time_since_last_context_switch < TIME_QUANTUM) {
      return curr_ctx;
    }

    return this.context_switch(curr_ctx);
  }

  /**
   * Switches context from the current to
   * the next context from the thread queue.
   */
  public context_switch(curr_ctx: Context): Context {
    const next_ctx = this.thread_queue.shift();

    if (next_ctx === undefined) return curr_ctx;

    this.last_context_switch = new Date();
    this.add_context_to_queue(curr_ctx);
    return next_ctx;
  }

  /**
   * Gets context of the next thread from the queue.
   */
  public restore_context(): Context | undefined {
    return this.thread_queue.shift();
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
        curr_ctx.consecutive_blocks,
      ),
    );
  }
}
