export class Context {
  operand_stack: Array<number>;
  runtime_stack: Array<number>;
  program_counter: number;
  environment: number;
  sleep_until: Date;
  blocked: boolean = false;

  constructor(
    program_counter: number,
    environment: number,
    operand_stack: Array<number> = [],
    runtime_stack: Array<number> = [],
    sleep_until: Date = new Date(),
    blocked: boolean = false,
  ) {
    this.operand_stack = operand_stack;
    this.runtime_stack = runtime_stack;
    this.program_counter = program_counter;
    this.environment = environment;
    this.sleep_until = sleep_until;
    this.blocked = blocked;
  }

  get_roots(): number[] {
    return [this.environment, ...this.operand_stack, ...this.runtime_stack];
  }
}
