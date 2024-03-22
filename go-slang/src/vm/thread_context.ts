export class Context {
  OS: Array<number>;
  RTS: Array<number>;
  PC: number;
  E: number;
  sleep_until: Date;

  constructor(
    pc: number,
    e: number,
    os: Array<number> = [],
    rts: Array<number> = [],
    sleep_until: Date = new Date(),
  ) {
    this.OS = os;
    this.RTS = rts;
    this.PC = pc;
    this.E = e;
    this.sleep_until = sleep_until;
  }
}
